import { useEffect, type RefObject } from "react";

/**
 * Sync a horizontal card carousel with the map: reports the `data-trip-slug` of the card in view.
 *  - Swipe (the track scrolls): the most visible card, via an IntersectionObserver on the track.
 *  - Hover / keyboard focus (desktop, where every card is visible): that card.
 * Never touches the carousel's own scrolling.
 */
export function useCarouselPreview(container: RefObject<HTMLElement | null>, onPreview: (slug: string | null) => void): void {
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>("[data-trip-slug]")];
    const track = cards[0]?.closest("ul");
    if (!track || cards.length === 0) return;

    let current: string | null = null;
    const report = (slug: string | undefined) => {
      if (!slug || slug === current) return;
      current = slug;
      onPreview(slug);
    };

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        // Only meaningful while the cards actually scroll; otherwise hover/focus decides.
        if (track.scrollWidth <= track.clientWidth + 2) return;
        let best: HTMLElement | null = null;
        let bestRatio = 0.5;
        for (const card of cards) {
          const ratio = ratios.get(card) ?? 0;
          if (ratio > bestRatio + 0.01) {
            best = card;
            bestRatio = ratio;
          }
        }
        report(best?.dataset.tripSlug);
      },
      { root: track, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const card of cards) observer.observe(card);

    const onEnter = (event: Event) => report((event.currentTarget as HTMLElement).dataset.tripSlug);
    for (const card of cards) {
      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("focus", onEnter);
    }
    return () => {
      observer.disconnect();
      for (const card of cards) {
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("focus", onEnter);
      }
    };
  }, [container, onPreview]);
}
