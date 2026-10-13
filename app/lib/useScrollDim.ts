import { useEffect, type RefObject } from "react";

/**
 * As the page scrolls over the map, write the progress (0..1) to `--map-dim` on `root`:
 * 0 at the top, 1 once the content has covered the map spacer. CSS dims the map with it.
 * One passive scroll listener, coalesced to one write per frame; nothing runs while idle.
 */
export function useScrollDim(root: RefObject<HTMLElement | null>, spacer: RefObject<HTMLElement | null>, key: string): void {
  useEffect(() => {
    const rootEl = root.current;
    const spacerEl = spacer.current;
    if (!rootEl || !spacerEl) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = spacerEl.offsetHeight;
      const progress = height < 48 ? 0 : Math.min(1, Math.max(0, window.scrollY / height));
      rootEl.style.setProperty("--map-dim", progress.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [root, spacer, key]);
}
