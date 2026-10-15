import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { MediaFrame } from "~/components/media";
import { Button, FieldLabel, Heading, LabelledMediaCarousel } from "~/components/ui";
import { getSpecies, getTripsNearPlace } from "~/content";
import type { Landmark, Likelihood, Sighting, Species, SpeciesGroup, Trip } from "~/content/types";
import { t } from "~/i18n";
import { monthName } from "~/lib/format";

/**
 * A place page (mountain, range, city, park or point of interest): peek block, then the story.
 * Rendered in normal flow, mobile first; the map layout decides how it is presented (rising sheet).
 * Every section hides itself when its data is missing, and a warm "ask Krishna" line fills the gap.
 */
export function PlaceScreen({ place }: { place: Landmark }) {
  const { openInquiry } = useInquiry();
  const plan = () => openInquiry({ placeId: place.id });
  const trips = getTripsNearPlace(place);
  const groups = groupSightings(place.sightings ?? []);
  const hasMedia = place.media.length > 0;
  // Nothing written about this place yet: one warm line instead of empty sections.
  const bare = !hasMedia && groups.length === 0 && !place.blurb && trips.length === 0;

  return (
    <article className="space-y-10 px-gutter pb-10 pt-2">
      {/* Peek: what and where, plus the one action. */}
      <section aria-label={place.name} className="space-y-4">
        <Link to="/" className="eyebrow inline-flex min-h-tap items-center text-accent hover:text-fg">
          <span aria-hidden="true">&larr;&nbsp;</span>
          {t("place.back")}
        </Link>
        <FieldLabel landmark={place} />
        <Button className="w-full md:w-auto" onClick={plan}>
          {t("place.peekPlan")}
        </Button>
      </section>

      {/* The story. */}
      <header className="space-y-4">
        <Heading level="h1" className="break-words md:text-h2">
          {place.name}
        </Heading>
        {place.blurb && <p className="max-w-prose">{place.blurb}</p>}
      </header>

      {hasMedia && (
        <LabelledMediaCarousel label={t("place.photos", { name: place.name })} items={place.media} slideClassName="basis-[88%]" />
      )}

      {groups.length > 0 && (
        <section aria-labelledby="place-around" className="space-y-4">
          <div>
            <Heading level="h3" as="h2" id="place-around">
              {t("place.around")}
            </Heading>
            <p className="mt-2 text-small text-fg-muted">{t("place.aroundIntro")}</p>
          </div>
          {groups.map(({ group, items }) => (
            <div key={group}>
              <h3 className="eyebrow mb-2 text-fg-muted">{t(`group.${group}`)}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {items.map(({ species, sighting }) => (
                  <li key={species.id} className="border border-border px-3 py-2">
                    <FieldLabel variant="compact" species={species} />
                    <p className="mt-0.5 not-italic text-small text-fg-muted">{sightingHint(sighting)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {bare && <p className="max-w-prose text-fg-muted">{t("place.askKrishna", { name: place.name })}</p>}

      {!bare && (
      <section aria-labelledby="place-nearby" className="space-y-4">
        <Heading level="h3" as="h2" id="place-nearby">
          {t("place.nearby")}
        </Heading>
        {trips.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {trips.map((trip) => (
              <li key={trip.slug}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="max-w-prose text-fg-muted">{t("place.askKrishnaTrips", { name: place.name })}</p>
        )}
      </section>
      )}

      <section className="space-y-3 border-t border-border pt-8">
        <Heading level="h2">{t("place.planHeading")}</Heading>
        <p className="max-w-prose text-fg-muted">{t("place.planBody", { name: place.name })}</p>
        <Button className="w-full md:w-auto" onClick={plan}>
          {t("place.peekPlan")}
        </Button>
      </section>
    </article>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link
      to={`/trips/${trip.slug}`}
      className="group block overflow-hidden border border-border bg-bg-raised transition-colors duration-(--duration-micro) hover:border-accent"
    >
      <MediaFrame asset={trip.cover} aspect="16 / 9" />
      <div className="space-y-1 p-3">
        <Heading level="h3" as="h3" className="group-hover:text-accent">
          {trip.title}
        </Heading>
        <p className="text-small text-fg-muted">{trip.tagline}</p>
        <p className="eyebrow pt-1 text-accent">
          {trip.durationDays === 1 ? t("place.nearbyDay") : t("place.nearbyDays", { count: trip.durationDays })} <span aria-hidden="true">&middot;</span> {t("place.viewTrip")}
        </p>
      </div>
    </Link>
  );
}

const GROUP_ORDER: SpeciesGroup[] = ["bird", "mammal", "butterfly", "plant", "reptile", "amphibian"];
const LIKELIHOOD_ORDER: Likelihood[] = ["common", "likely", "possible", "rare"];

type GroupedSightings = { group: SpeciesGroup; items: { species: Species; sighting: Sighting }[] }[];

/** Sightings grouped by species group (birds first), most-often-seen first; unknown species are skipped. */
function groupSightings(sightings: Sighting[]): GroupedSightings {
  const byGroup = new Map<SpeciesGroup, GroupedSightings[number]["items"]>();
  for (const sighting of sightings) {
    const species = getSpecies(sighting.speciesId);
    if (!species) continue;
    byGroup.set(species.group, [...(byGroup.get(species.group) ?? []), { species, sighting }]);
  }
  return GROUP_ORDER.flatMap((group) => {
    const items = byGroup.get(group);
    if (!items) return [];
    items.sort((a, b) => LIKELIHOOD_ORDER.indexOf(a.sighting.likelihood) - LIKELIHOOD_ORDER.indexOf(b.sighting.likelihood));
    return [{ group, items }];
  });
}

/** A gentle phrase ("often seen"), plus the best months when the sighting is seasonal. */
function sightingHint({ likelihood, months }: Sighting): string {
  const phrase = t(`place.likelihood.${likelihood}`);
  return months?.length ? `${phrase} · ${t("place.months", { months: months.map(monthName).join(", ") })}` : phrase;
}
