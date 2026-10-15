import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useMapLayoutContext } from "~/components/map/layoutContext";
import { MediaFrame } from "~/components/media";
import { StoryButton, useStoryUp } from "~/components/story";
import { TripCard } from "~/components/trips";
import { FieldLabel, Heading, inlineLinkClasses } from "~/components/ui";
import { getPlace, getTripsInRegion } from "~/content";
import type { Region } from "~/content/types";
import { t } from "~/i18n";
import { useHydrated } from "~/lib/useHydrated";

/**
 * A region page (/regions/<slug>/), the story rising over the map like a trip's: the region's name
 * and line, its photo, a few paragraphs about it, then its trips (hovering or focusing one highlights
 * its route on the map) and the parks and peaks that belong to it. Fully readable without JS.
 */
export function RegionScreen({ region }: { region: Region }) {
  const { previewTrip } = useMapLayoutContext();
  const hydrated = useHydrated();
  const storyUp = useStoryUp();
  const trips = getTripsInRegion(region.slug);
  // The region's parks and peaks; one that is the region itself (e.g. Chitwan National Park) isn't repeated.
  const places = region.landmarkIds.flatMap((id) => getPlace(id) ?? []).filter((place) => place.name !== region.name);

  // Leaving the page (e.g. clicking a card mid-hover) clears any route still highlighted.
  const previewRef = useRef(previewTrip);
  previewRef.current = previewTrip;
  useEffect(() => () => previewRef.current(null), []);

  return (
    <article className="space-y-12 px-gutter pt-2 pb-20 md:space-y-16 md:pb-28">
      <StoryButton up={storyUp} />

      <div>
        {/* Nearly invisible while the story only peeks, like the trip page's; full once the story is up. */}
        <Link
          to="/"
          className={`eyebrow inline-flex min-h-tap items-center text-accent transition-opacity duration-(--duration-ui) ease-out hover:text-fg focus-visible:opacity-100 motion-reduce:transition-none ${hydrated && !storyUp ? "opacity-[0.18]" : "opacity-100"}`}
        >
          <span aria-hidden="true">&larr;&nbsp;</span>
          {t("region.back")}
        </Link>

        <header className="mt-4">
          <Heading level="h1" className="break-words md:text-h2">
            {region.name}
          </Heading>
          <p className="mt-3 text-fg-muted">{region.tagline}</p>
        </header>
      </div>

      <figure>
        <MediaFrame asset={region.cover} />
        <FieldLabel as="figcaption" observation={region.cover.observation} className="mt-4" />
      </figure>

      <div className="max-w-prose space-y-5">
        {region.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <section aria-labelledby="region-trips">
        <Heading level="h3" as="h2" id="region-trips">
          {t("region.trips", { name: region.name })}
        </Heading>
        <ul className="mt-8 grid gap-x-8 gap-y-16 sm:grid-cols-2">
          {trips.map((trip) => (
            <li key={trip.slug}>
              <TripCard trip={trip} headingAs="h3" onPreview={previewTrip} />
            </li>
          ))}
        </ul>
      </section>

      {places.length > 0 && (
        <section aria-labelledby="region-places">
          <Heading level="h3" as="h2" id="region-places">
            {t("region.places", { name: region.name })}
          </Heading>
          <ul className="mt-4 flex flex-wrap gap-x-6">
            {places.map((place) => (
              <li key={place.id}>
                <Link to={`/places/${place.id}`} className={`inline-flex min-h-tap items-center ${inlineLinkClasses}`}>
                  {place.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
