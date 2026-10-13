import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { useMapLayoutContext } from "~/components/map/layoutContext";
import { MediaCarousel } from "~/components/media";
import { Button, Heading } from "~/components/ui";
import { getSpecies } from "~/content";
import type { Sighting, SpeciesGroup, Trip, Waypoint } from "~/content/types";
import { t } from "~/i18n";
import { formatPrice, monthName } from "~/lib/format";

const perKey = { person: "trip.perPerson", group: "trip.perGroup", day: "trip.perDay" } as const;

export function TripScreen({ trip }: { trip: Trip }) {
  const { openInquiry } = useInquiry();
  const { activeWaypointId, setActiveWaypoint } = useMapLayoutContext();
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
      <Link to="/" className="eyebrow inline-flex min-h-tap items-center text-accent hover:underline">
        <span aria-hidden="true">&larr;&nbsp;</span>
        {t("trip.back")}
      </Link>

      <header className="-mt-4">
        <Heading level="h1" className="md:text-h2">
          {trip.title}
        </Heading>
        <p className="mt-3 text-fg-muted">{trip.tagline}</p>
      </header>

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

      <section>
        <Heading level="h3" as="h2">{t("trip.itinerary")}</Heading>
        <ol className="mt-3 space-y-2">
          {trip.waypoints.map((waypoint) => (
            <WaypointItem
              key={waypoint.id}
              waypoint={waypoint}
              active={waypoint.id === activeWaypointId}
              onToggle={() => setActiveWaypoint(waypoint.id === activeWaypointId ? null : waypoint.id)}
            />
          ))}
        </ol>
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

      {pricing?.show && (
        <p>
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

function WaypointItem({ waypoint, active, onToggle }: { waypoint: Waypoint; active: boolean; onToggle: () => void }) {
  const details = [
    t("trip.day", { day: waypoint.day }),
    `${waypoint.altitudeM.toLocaleString("en")} m`,
    waypoint.nights > 0 ? t("trip.nights", { count: waypoint.nights }) : null,
  ].filter(Boolean);

  return (
    <li className={`overflow-hidden rounded-card border ${active ? "border-route bg-bg" : "border-border"}`}>
      <button
        type="button"
        className="flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left"
        aria-expanded={active}
        onClick={onToggle}
      >
        <span
          aria-hidden="true"
          className={`size-3.5 shrink-0 rounded-full border-2 border-fg ${active ? "bg-marker" : "bg-transparent"}`}
        />
        <span className="min-w-0">
          <span className="block font-medium">{waypoint.name}</span>
          <span className="eyebrow mt-0.5 block text-fg-muted">{details.join(" · ")}</span>
        </span>
      </button>

      {/* Always in the DOM so the prerendered HTML carries the full itinerary. */}
      <div hidden={!active} className="space-y-3 px-3 pb-4 text-small">
        {waypoint.stay && (
          <p>
            <span className="eyebrow text-fg-muted">{t("trip.stay")}: </span>
            {waypoint.stay.name ?? waypoint.stay.kind}
          </p>
        )}
        <p>{waypoint.summary}</p>
        <Sightings sightings={waypoint.sightings} />
      </div>
    </li>
  );
}

function Sightings({ sightings }: { sightings: Sighting[] }) {
  const groups = new Map<SpeciesGroup, { name: string; sighting: Sighting }[]>();
  for (const sighting of sightings) {
    const species = getSpecies(sighting.speciesId);
    if (!species) continue;
    const list = groups.get(species.group) ?? [];
    list.push({ name: species.commonName, sighting });
    groups.set(species.group, list);
  }
  if (groups.size === 0) return null;

  return (
    <div>
      <h3 className="eyebrow mb-1 font-mono text-fg">{t("trip.seen")}</h3>
      {[...groups].map(([group, items]) => (
        <section key={group} className="mt-2">
          <h4 className="eyebrow font-mono text-fg-muted">{t(`group.${group}`)}</h4>
          <ul>
            {items.map(({ name, sighting }) => (
              <li key={sighting.speciesId}>
                {name} <span className="text-fg-muted">({t(`likelihood.${sighting.likelihood}`)})</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
