import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { useMapLayoutContext } from "~/components/map/layoutContext";
import { Button } from "~/components/ui/Button";
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

  return (
    <article className="space-y-6 p-5">
      <Link to="/" className="text-sm font-semibold text-forest hover:underline">
        {t("trip.back")}
      </Link>

      <header>
        <h1 className="text-3xl">{trip.title}</h1>
        <p className="mt-1 text-ink-soft">{trip.tagline}</p>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-ink-soft">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <p>{trip.summary}</p>

      <section>
        <h2 className="text-xl">{t("trip.highlights")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {trip.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl">{t("trip.itinerary")}</h2>
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
          <h2 className="text-xl">{t("trip.includes")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {trip.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {pricing?.show && (
        <p>
          <span className="text-ink-soft">{t("trip.price")}: </span>
          <strong>{formatPrice(pricing.amount, pricing.currency)}</strong> {t(perKey[pricing.per])}
          {pricing.note && <span className="block text-sm text-ink-soft">{pricing.note}</span>}
        </p>
      )}

      <Button onClick={() => openInquiry({ tripSlug: trip.slug })}>{t("trip.inquire")}</Button>
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
    <li className={`rounded-lg border ${active ? "border-forest bg-snow" : "border-ink/15"}`}>
      <button
        type="button"
        className="w-full px-3 py-2 text-left"
        aria-expanded={active}
        onClick={onToggle}
      >
        <span className="block font-semibold">{waypoint.name}</span>
        <span className="block text-sm text-ink-soft">{details.join(" · ")}</span>
      </button>

      {/* Always in the DOM so the prerendered HTML carries the full itinerary. */}
      <div hidden={!active} className="space-y-3 px-3 pb-3 text-sm">
        {waypoint.stay && (
          <p>
            <span className="text-ink-soft">{t("trip.stay")}: </span>
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
      <h3 className="mb-1 text-base">{t("trip.seen")}</h3>
      {[...groups].map(([group, items]) => (
        <section key={group} className="mt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t(`group.${group}`)}</h4>
          <ul>
            {items.map(({ name, sighting }) => (
              <li key={sighting.speciesId}>
                {name} <span className="text-ink-soft">({t(`likelihood.${sighting.likelihood}`)})</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
