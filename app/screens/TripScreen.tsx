import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { DayList } from "~/components/journey/DayList";
import { dayHref, useJourneyUrl } from "~/components/journey/useJourneyUrl";
import { useMapLayoutContext } from "~/components/map/layoutContext";
import { MediaCarousel } from "~/components/media";
import { Button, ButtonLink, Heading } from "~/components/ui";
import type { Trip } from "~/content/types";
import { t } from "~/i18n";
import { formatPrice, monthName } from "~/lib/format";
import { dayCount } from "~/lib/tripDays";
import { useHydrated } from "~/lib/useHydrated";

const perKey = { person: "trip.perPerson", group: "trip.perGroup", day: "trip.perDay" } as const;

/**
 * The trip OVERVIEW: the story rising over the map. Near the top, "Start the journey" opens the day
 * view (components/journey); "The way, day by day" is the full itinerary, every day in reading order
 * (the day view's content, prerendered), each with "Day n →" into the day view at that day.
 */
export function TripScreen({ trip }: { trip: Trip }) {
  const { openInquiry } = useInquiry();
  const { activeWaypointId, setActiveWaypoint, step } = useMapLayoutContext();
  const hydrated = useHydrated();
  const journey = useJourneyUrl(trip);
  const openDay = hydrated ? journey.open : null;
  const storyUp = useStoryUp();
  // The stop the map is showing right now (chosen in the URL, or focused by the stepping engine).
  const focusedId = activeWaypointId ?? (step?.tripSlug === trip.slug ? step.waypointId : null);
  const { pricing } = trip;

  const facts: [string, string][] = [
    [t("trip.region"), trip.region],
    [t("trip.duration"), t("trip.days", { count: trip.durationDays })],
    [t("trip.difficulty"), t(`difficulty.${trip.difficulty}`)],
    [t("trip.maxAltitude"), `${trip.maxAltitudeM.toLocaleString("en")} m`],
    [t("trip.bestMonths"), trip.bestMonths.map(monthName).join(", ")],
  ];

  const list = "mt-3 list-disc space-y-1.5 pl-5 marker:text-accent";

  return (
    <article className="space-y-8 px-gutter pt-2">
      <StoryButton up={storyUp} />

      {/* Nearly invisible while the story only peeks (it confused there); full once the story is up. Still reachable by keyboard. */}
      <Link
        to="/"
        className={`eyebrow inline-flex min-h-tap items-center text-accent transition-opacity duration-(--duration-ui) ease-out hover:text-fg focus-visible:opacity-100 motion-reduce:transition-none ${hydrated && !storyUp ? "opacity-[0.18]" : "opacity-100"}`}
      >
        <span aria-hidden="true">&larr;&nbsp;</span>
        {t("trip.back")}
      </Link>

      <header className="-mt-4">
        <Heading level="h1" className="md:text-h2">
          {trip.title}
        </Heading>
        <p className="mt-3 text-fg-muted">{trip.tagline}</p>
      </header>

      {/* The way into the day view; without JS it jumps to day 1 of the itinerary below. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ButtonLink
          href={dayHref(trip, 1)}
          onClick={(event) => {
            if (!openDay) return;
            event.preventDefault();
            openDay(1);
          }}
        >
          {t("journey.start")}
        </ButtonLink>
        <span className="eyebrow text-fg-muted">
          {t("trip.days", { count: dayCount(trip) })} · {t("journey.startNote")}
        </span>
      </div>

      <MediaCarousel
        label={t("media.photos")}
        items={trip.reel}
        slideClassName="basis-[88%]"
      />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-border py-5">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="eyebrow text-fg-muted">{label}</dt>
            <dd className="mt-1 text-small font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>

      <p>{trip.summary}</p>

      <section>
        <Heading level="h3" as="h2">{t("trip.highlights")}</Heading>
        <ul className={list}>
          {trip.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="the-way">
        <Heading level="h3" as="h2" id="the-way">{t("journey.theWay")}</Heading>
        <DayList
          trip={trip}
          activeWaypointId={activeWaypointId}
          focusedId={focusedId}
          onToggleStop={(id) => setActiveWaypoint(id === activeWaypointId ? null : id)}
          onOpenDay={openDay}
        />
      </section>

      {trip.includes && (
        <section>
          <Heading level="h3" as="h2">{t("trip.includes")}</Heading>
          <ul className={list}>
            {trip.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {trip.excludes && (
        <section>
          <Heading level="h3" as="h2">{t("trip.excludes")}</Heading>
          <ul className={list}>
            {trip.excludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {pricing?.show && (
        <p className="not-italic">
          <span className="eyebrow text-fg-muted">{t("trip.price")}: </span>
          <strong className="font-medium">{formatPrice(pricing.amount, pricing.currency)}</strong> {t(perKey[pricing.per])}
          {pricing.note && <span className="mt-1 block text-small text-fg-muted">{pricing.note}</span>}
        </p>
      )}

      <Button className="hidden md:inline-flex" onClick={() => openInquiry({ tripSlug: trip.slug })}>
        {t("trip.inquire")}
      </Button>

      {/* Mobile: thumb-reachable bar that sticks to the bottom of the sheet; in flow at the end, so it never covers content. */}
      <div className="sticky bottom-0 z-10 -mx-gutter border-t border-border bg-bg-raised/95 px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <Button className="w-full" onClick={() => openInquiry({ tripSlug: trip.slug })}>
          {t("trip.inquire")}
        </Button>
      </div>
    </article>
  );
}

/**
 * The round button on the story's top edge (navigator.css `.nbt-story-btn`), styled like a stop
 * marker: it isn't obvious that scrolling brings the story up over the map, so this does. Once the
 * story is up it flips and takes you back to the map. Without JS it is a link to the story.
 */
/** True once the story has been pulled up over the map (scrolled a quarter of a screen). */
function useStoryUp(): boolean {
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

function StoryButton({ up: down }: { up: boolean }) {
  const go = (event: React.MouseEvent) => {
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
