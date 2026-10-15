import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { DayList } from "~/components/journey/DayList";
import { dayHref, useJourneyUrl } from "~/components/journey/useJourneyUrl";
import { useMapLayoutContext } from "~/components/map/layoutContext";
import { MediaCarousel } from "~/components/media";
import { StoryButton, useStoryUp } from "~/components/story";
import { Button, ButtonLink, Heading } from "~/components/ui";
import { getRegion } from "~/content";
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
  const region = getRegion(trip.regionSlug);

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

      {/* Back to the trip's region. Nearly invisible while the story only peeks (it confused there); full once the story is up. Still reachable by keyboard. */}
      <Link
        to={region ? `/regions/${region.slug}` : "/"}
        className={`eyebrow inline-flex min-h-tap items-center text-accent transition-opacity duration-(--duration-ui) ease-out hover:text-fg focus-visible:opacity-100 motion-reduce:transition-none ${hydrated && !storyUp ? "opacity-[0.18]" : "opacity-100"}`}
      >
        <span aria-hidden="true">&larr;&nbsp;</span>
        {region ? t("trip.backRegion", { region: region.name }) : t("trip.back")}
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
