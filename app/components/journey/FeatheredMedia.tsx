import { useEffect, useRef, useState } from "react";
import { getPlace, getSpecies } from "~/content";
import type { MediaAsset, Observation } from "~/content/types";
import { assetUrl } from "~/lib/site";
import type { PlacedMedia } from "./dayLayout";
import { featherMask } from "./feather";

/**
 * One media slot of the day view (A or B): a large photo or ambient clip anchored to a screen edge
 * or corner (placed by dayLayout.ts); its outer edges run off-screen and only its inner edges
 * dissolve into the map (CSS mask, journey.css `.jr-feather`). When the day changes, the new media spreads out from
 * the centre through the old one (a registered `--jr-reveal` animated once, ~0.8 s), and the old
 * fades and is removed; reduced motion gets a plain crossfade.
 *
 * Video: poster first, always. Only the current day's clip loads and plays (muted, loop, inline);
 * its `src` is set only while current and is released when the day moves on (one decoder on
 * phones). Save-Data, slow connections and reduced motion get the poster only.
 */

type Layer = { key: string; asset: MediaAsset; day: number; leaving: boolean; intro?: boolean };

const LEAVE_MS = 900;

export function MediaSlot({
  slot,
  asset,
  day,
  priority,
  intro = false,
  rect,
}: {
  slot: "a" | "b";
  asset: MediaAsset | undefined;
  day: number;
  priority: boolean;
  /** The first media also spreads in (opening the day view in-app). */
  intro?: boolean;
  /** Where the layout pass put this slot, and the screen edge it is anchored to (null: hidden). */
  rect: PlacedMedia | null;
}) {
  const key = asset ? `${day}:${stillOf(asset)}` : null;
  const [layers, setLayers] = useState<Layer[]>(() => (asset && key ? [{ key, asset, day, leaving: false, intro }] : []));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setLayers((current) => {
      const last = current[current.length - 1];
      if (last && last.key === key && !last.leaving) return current; // unchanged (e.g. a re-run effect)
      const kept = current.filter((l) => l.key !== key).map((l) => ({ ...l, leaving: true }));
      return asset && key ? [...kept, { key, asset, day, leaving: false }] : kept;
    });
    const timer = window.setTimeout(() => setLayers((current) => current.filter((l) => !l.leaving)), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`jr-slot jr-slot--${slot}`}
      data-corner={rect?.corner}
      hidden={!rect}
      style={rect ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h } : undefined}
    >
      {layers.map((layer, i) => (
        <FeatheredMedia
          key={layer.key}
          slot={slot}
          asset={layer.asset}
          day={layer.day}
          leaving={layer.leaving}
          entering={!layer.leaving && i === layers.length - 1 && (layers.length > 1 || Boolean(layer.intro))}
          priority={priority && i === 0}
        />
      ))}
    </div>
  );
}

const stillOf = (a: MediaAsset) => (a.kind === "image" ? a.src : a.poster);

function videoSource(asset: MediaAsset): string | null {
  if (asset.kind !== "video") return null;
  const source = asset.sources.find((s) => s.host !== "youtube");
  return source && "src" in source ? assetUrl(source.src) : null;
}

/** Clips may autoplay: no Save-Data, not a slow connection, no reduced motion. */
function clipsAllowed(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (c?.saveData) return false;
  return !/(^|-)(2g|3g)$/.test(c?.effectiveType ?? "");
}

type FeatheredMediaProps = { slot: "a" | "b"; asset: MediaAsset; day: number; leaving: boolean; entering: boolean; priority: boolean };

function FeatheredMedia({ slot, asset, day, leaving, entering, priority }: FeatheredMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const src = videoSource(asset);
  const live = Boolean(src) && canPlay && !leaving;
  const focal = asset.kind === "image" ? asset.focal : undefined;

  useEffect(() => setCanPlay(clipsAllowed()), []);

  // Play only while the tab is visible; release the decoder when this layer stops being current.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !live) return;
    const sync = () => {
      if (document.hidden) video.pause();
      else void video.play().catch(() => undefined);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [live]);

  const state = leaving ? "is-leaving" : entering ? "is-entering" : "";
  return (
    <figure className={`jr-media ${state}`} aria-hidden={leaving || undefined}>
      <div className="jr-feather" style={{ "--jr-blob": featherMask(day, slot) } as React.CSSProperties}>
        <img
          src={assetUrl(stillOf(asset))}
          alt={asset.alt}
          decoding="async"
          draggable={false}
          fetchPriority={priority ? "high" : "auto"}
          className="jr-media__still"
          style={focal ? { objectPosition: `${focal[0] * 100}% ${focal[1] * 100}%` } : undefined}
        />
        {live && src && (
          <video
            ref={videoRef}
            className={`jr-media__clip ${playing ? "is-playing" : ""}`}
            src={src}
            poster={assetUrl(stillOf(asset))}
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="none"
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onError={() => setPlaying(false)}
          />
        )}
      </div>
      {asset.observation && !leaving && shortCaption(asset.observation) && <figcaption className="jr-media__caption">{shortCaption(asset.observation)}</figcaption>}
    </figure>
  );
}

/** A short caption: the bird's common name, else the mountain, else the place. No scientific names. */
function shortCaption(o: Observation): string | undefined {
  const species = o.speciesIds?.[0] ? getSpecies(o.speciesIds[0]) : undefined;
  if (species) return species.commonName;
  const mountain = o.landmarkId ? getPlace(o.landmarkId) : undefined;
  return mountain?.name ?? o.place?.split(",")[0];
}
