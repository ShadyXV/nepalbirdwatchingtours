/**
 * A small CPU-side elevation sampler for the visibility checks (visibility.ts): fetches the same
 * Terrarium DEM tiles the map uses (so they usually come from the HTTP cache), decodes them once
 * into 16-bit metres, and answers "how high is the ground here?" without touching the GPU.
 *
 * One zoom level only (DEM_SAMPLE_ZOOM, ~130 m per pixel at z10): ridges that hide a stop are
 * hundreds of metres wide, so that is plenty. Keeps at most MAX_TILES decoded tiles (~128 kB each).
 */
import type { LngLat } from "~/content/types";
import type { Bounds } from "~/lib/geo";

export const DEM_SAMPLE_ZOOM = 10;
const TILE = 256;
const MAX_TILES = 36;
/** Refuse requests that would need more tiles than this (e.g. a whole-country area). */
const MAX_TILES_PER_LOAD = 25;

type TileEntry = Int16Array | null;

export class DemSampler {
  private readonly template: string;
  private readonly z: number;
  private readonly tiles = new Map<string, TileEntry>();
  private readonly pending = new Map<string, Promise<void>>();

  constructor(template: string, z = DEM_SAMPLE_ZOOM) {
    this.template = template;
    this.z = z;
  }

  /**
   * Make sure every tile covering `area` is decoded. Resolves true when they all are (false if the
   * area is too large, a tile failed, or `timeoutMs` passed first; loading continues in the background).
   */
  async load(area: Bounds, timeoutMs: number): Promise<boolean> {
    const [x0, y0] = this.tileXY([area.west, area.north]);
    const [x1, y1] = this.tileXY([area.east, area.south]);
    const count = (x1 - x0 + 1) * (y1 - y0 + 1);
    if (count > MAX_TILES_PER_LOAD) return false;
    const jobs: Promise<void>[] = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) jobs.push(this.ensure(x, y));
    const all = Promise.all(jobs).then(() => true);
    const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs));
    const done = await Promise.race([all, timeout]);
    if (!done) return false;
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (!this.tiles.get(`${x}/${y}`)) return false;
    return true;
  }

  /** Ground elevation in metres (nearest DEM pixel), or null when that tile isn't loaded. */
  elevation([lng, lat]: LngLat): number | null {
    const n = 2 ** this.z;
    const fx = ((lng + 180) / 360) * n;
    const s = Math.sin((lat * Math.PI) / 180);
    const fy = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
    const x = Math.floor(fx);
    const y = Math.floor(fy);
    const data = this.tiles.get(`${x}/${y}`);
    if (!data) return null;
    const px = Math.min(TILE - 1, Math.floor((fx - x) * TILE));
    const py = Math.min(TILE - 1, Math.floor((fy - y) * TILE));
    return data[py * TILE + px];
  }

  private tileXY([lng, lat]: LngLat): [number, number] {
    const n = 2 ** this.z;
    const s = Math.sin((lat * Math.PI) / 180);
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n);
    return [Math.max(0, Math.min(n - 1, x)), Math.max(0, Math.min(n - 1, y))];
  }

  private ensure(x: number, y: number): Promise<void> {
    const key = `${x}/${y}`;
    if (this.tiles.has(key)) return Promise.resolve();
    const running = this.pending.get(key);
    if (running) return running;
    const url = this.template.replace("{z}", String(this.z)).replace("{x}", String(x)).replace("{y}", String(y));
    const job = decodeTerrarium(url)
      .catch(() => null)
      .then((data) => {
        this.pending.delete(key);
        this.tiles.set(key, data);
        // Oldest first: drop the least recently added tiles beyond the cap.
        while (this.tiles.size > MAX_TILES) this.tiles.delete(this.tiles.keys().next().value as string);
      });
    this.pending.set(key, job);
    return job;
  }
}

/** Fetch a Terrarium PNG and decode it to metres: (R * 256 + G + B / 256) - 32768. */
async function decodeTerrarium(url: string): Promise<Int16Array> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error(`DEM ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(TILE, TILE) : Object.assign(document.createElement("canvas"), { width: TILE, height: TILE });
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("No 2D context");
  ctx.drawImage(bitmap, 0, 0, TILE, TILE);
  bitmap.close();
  const rgba = ctx.getImageData(0, 0, TILE, TILE).data;
  const out = new Int16Array(TILE * TILE);
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    out[i] = Math.round(rgba[p] * 256 + rgba[p + 1] + rgba[p + 2] / 256 - 32768);
  }
  return out;
}
