import { useEffect, useState, type MouseEvent } from "react";
import { t } from "~/i18n";

/** True once the story has been pulled up over the map (scrolled a quarter of a screen). */
export function useStoryUp(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      setUp(window.scrollY > window.innerHeight * 0.25);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return up;
}

/**
 * The round button on the story's top edge (navigator.css `.nbt-story-btn`), styled like a stop
 * marker: it isn't obvious that scrolling brings the story up over the map, so this does. Once the
 * story is up it flips and takes you back to the map. Without JS it is a link to the story.
 */
export function StoryButton({ up: down }: { up: boolean }) {
  const go = (event: MouseEvent) => {
    const story = document.getElementById("story");
    if (!story) return;
    event.preventDefault();
    const header = document.querySelector("body > header")?.getBoundingClientRect().height ?? 0;
    const top = down ? 0 : story.getBoundingClientRect().top + window.scrollY - header;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "instant" : "smooth" });
  };

  const label = down ? t("map.showMap") : t("map.showDetails");
  return (
    <div className="nbt-story-btn" data-down={down ? "" : undefined}>
      <a href="#story" aria-label={label} title={label} onClick={go}>
        <svg aria-hidden="true" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" />
          <path d="M13.5 22.5L20 16l6.5 6.5" />
        </svg>
      </a>
    </div>
  );
}
