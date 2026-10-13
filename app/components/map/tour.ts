/**
 * Autoplay for the stepping engine (the S1 auto-tour): an automatic "next" on a timer. It asks the
 * engine to step, waits for the camera to arrive, dwells, steps again; when there is no next stop it
 * runs `finish` (pull back to the whole route) and ends. Pausing cancels the pending step; nothing
 * runs while paused. It never touches the URL.
 */

export type AutoplayStatus = "off" | "playing" | "paused" | "ended";

type AutoplayOptions = {
  /** Step to the next stop; resolves true when the camera has arrived, false when there is no next stop. */
  step: () => Promise<boolean>;
  /** After the last stop: pull back to the whole route. */
  finish: () => Promise<void>;
  /** Time spent at each stop after arriving, ms. */
  dwellMs: () => number;
  onStatus: (status: AutoplayStatus) => void;
};

export class Autoplay {
  private readonly o: AutoplayOptions;
  private status: AutoplayStatus = "off";
  /** Bumped on pause / stop, so a step that is still in flight doesn't schedule the next one. */
  private generation = 0;
  private timer = 0;

  constructor(options: AutoplayOptions) {
    this.o = options;
  }

  get current(): AutoplayStatus {
    return this.status;
  }

  play(): void {
    if (this.status === "playing") return;
    this.set("playing");
    void this.loop(++this.generation);
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.halt();
    this.set("paused");
  }

  /** Back to "off" (left the trip, or the engine was reset). */
  stop(): void {
    this.halt();
    this.set("off");
  }

  private halt(): void {
    this.generation++;
    window.clearTimeout(this.timer);
  }

  private async loop(generation: number): Promise<void> {
    const moved = await this.o.step();
    if (generation !== this.generation) return;
    if (!moved) {
      await this.o.finish();
      if (generation !== this.generation) return;
      this.set("ended");
      return;
    }
    this.timer = window.setTimeout(() => void this.loop(generation), this.o.dwellMs());
  }

  private set(status: AutoplayStatus): void {
    this.status = status;
    this.o.onStatus(status);
  }
}
