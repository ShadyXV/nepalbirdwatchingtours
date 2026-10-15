import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { MediaAsset } from "~/content/types";
import { t } from "~/i18n";
import { MediaFrame } from "./MediaFrame";

type CarouselProps = {
  /** Accessible name, e.g. "Trips". */
  label: string;
  /** One child per slide. */
  children: ReactNode;
  /**
   * Tailwind width classes for one slide when there are several. The default shows
   * the next slide peeking on phones. A lone slide always fills the width.
   */
  slideClassName?: string;
  /** Bleed the track to the screen edge on phones (the parent has `px-gutter`). */
  bleed?: boolean;
  /** Tailwind gap classes between slides; a small gap by default. */
  gapClassName?: string;
  className?: string;
};

const DEFAULT_SLIDE = "basis-[85%] sm:basis-[47%] lg:basis-[32%]";

/**
 * Horizontal scroll-snap carousel. Touch swipe and keyboard scrolling are native
 * (the track is focusable); prev/next buttons appear on fine-pointer devices >= md.
 */
export function Carousel({ label, children, slideClassName = DEFAULT_SLIDE, bleed = true, gapClassName = "gap-3", className = "" }: CarouselProps) {
  const slides = Children.toArray(children);
  const total = slides.length;
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: total <= 1 });
  const id = useId();

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const count = track.children.length;
    const atEnd = Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 2;
    const atStart = track.scrollLeft <= 2;
    const first = track.children[0] as HTMLElement | undefined;
    const stride = first ? first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0") : 1;
    const nearest = Math.min(count - 1, Math.round(track.scrollLeft / stride));
    const scrollable = track.scrollWidth > track.clientWidth + 2;
    setIndex(scrollable && atEnd ? count - 1 : nearest);
    setEdges({ start: atStart, end: atEnd });
  }, []);

  useEffect(() => {
    update();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => observer.disconnect();
  }, [update, total]);

  function step(direction: 1 | -1) {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    if (!track || !first) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    track.scrollBy({ left: direction * (first.offsetWidth + gap) });
  }

  if (total === 0) return null;
  const several = total > 1;
  const slideWidth = several ? slideClassName : "basis-full";
  const edgeBleed = bleed ? "-mx-gutter px-gutter scroll-px-gutter sm:-mx-gutter-lg sm:px-gutter-lg sm:scroll-px-gutter-lg" : "";
  const nav =
    "hidden size-tap items-center justify-center border border-fg bg-bg/80 text-fg backdrop-blur transition-colors duration-(--duration-micro) hover:bg-accent hover:text-accent-fg disabled:opacity-30 disabled:hover:bg-bg/80 disabled:hover:text-fg md:pointer-fine:inline-flex";

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={t("media.carousel", { label })}
      className={className}
    >
      <ul
        ref={trackRef}
        id={id}
        tabIndex={0}
        aria-label={label}
        onScroll={update}
        className={`no-scrollbar flex snap-x snap-mandatory ${gapClassName} overflow-x-auto overscroll-x-contain scroll-smooth ${edgeBleed}`}
      >
        {slides.map((slide, i) => (
          <li
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={t("media.slide", { current: i + 1, total })}
            className={`min-w-0 shrink-0 snap-start ${slideWidth}`}
          >
            {slide}
          </li>
        ))}
      </ul>

      {several && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="eyebrow text-fg-muted" aria-live="polite">
            {t("media.counter", { current: index + 1, total })}
          </p>
          <div className="flex gap-2">
            <button type="button" className={nav} aria-controls={id} aria-label={t("media.prev")} disabled={edges.start} onClick={() => step(-1)}>
              <Arrow direction="left" />
            </button>
            <button type="button" className={nav} aria-controls={id} aria-label={t("media.next")} disabled={edges.end} onClick={() => step(1)}>
              <Arrow direction="right" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 fill-none stroke-current ${direction === "left" ? "-scale-x-100" : ""}`} strokeWidth="1.75">
      <path d="M5 2l6 6-6 6" />
    </svg>
  );
}

type MediaCarouselProps = {
  label: string;
  items: MediaAsset[];
  /** CSS aspect-ratio value; landscape 3:2 by default. */
  aspect?: string;
  slideClassName?: string;
  bleed?: boolean;
  className?: string;
};

/** A carousel of images and video posters. Renders nothing for an empty list. */
export function MediaCarousel({ label, items, aspect = "3 / 2", slideClassName, bleed, className }: MediaCarouselProps) {
  if (items.length === 0) return null;
  return (
    <Carousel label={label} slideClassName={slideClassName} bleed={bleed} className={className}>
      {items.map((asset, i) => (
        <figure key={i}>
          <MediaFrame asset={asset} aspect={aspect} />
          {asset.credit && <figcaption className="mt-1 text-small text-fg-muted">{asset.credit}</figcaption>}
        </figure>
      ))}
    </Carousel>
  );
}
