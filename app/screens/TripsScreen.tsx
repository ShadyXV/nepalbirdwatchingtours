import { useEffect, useId, useState } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { TripCard } from "~/components/trips";
import { arrowLinkClasses, Heading, LinkArrow, SectionTitle } from "~/components/ui";
import { getPublishedTrips, getRegions } from "~/content";
import type { Trip, TripKind } from "~/content/types";
import { t } from "~/i18n";
import { useHydrated } from "~/lib/useHydrated";

/** Filter order; only kinds that have a published trip are offered. */
const KIND_ORDER: TripKind[] = ["birding-trek", "day-tour", "wildlife-safari", "trek-support"];

/**
 * Filter links name this page's path outright: a relative `?kind=` link would render as `/trips?…`
 * when prerendered but `/trips/?…` in a browser that landed on `/trips/`, a hydration mismatch.
 */
const TRIPS_PATH = "/trips";

const isKind = (value: string | null): value is TripKind => KIND_ORDER.includes(value as TripKind);

/**
 * /trips/: every published trip as a card, grouped by region (each group's title links to its region
 * page). Search by name (?q=) and filter by kind (?kind=) work across the groups; a group with nothing
 * left to show is hidden. The prerendered page (and any visit without JavaScript) shows the full list;
 * filtering starts once the page is hydrated, so the server HTML and the first client render match.
 */
export function TripsScreen() {
  const trips = getPublishedTrips();
  const kinds = KIND_ORDER.filter((kind) => trips.some((trip) => trip.kind === kind));
  const hydrated = useHydrated();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchId = useId();

  // The search box keeps its own text (so typing never lags behind the URL), seeded from ?q=.
  const [query, setQuery] = useState("");
  useEffect(() => {
    // Only on hydration: afterwards the box leads and the URL follows.
    if (hydrated) setQuery(searchParams.get("q") ?? "");
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const kindParam = hydrated ? searchParams.get("kind") : null;
  const kind = isKind(kindParam) ? kindParam : null;
  const needle = query.trim().toLowerCase();
  const shown = trips.filter((trip) => (!kind || trip.kind === kind) && (!needle || trip.title.toLowerCase().includes(needle)));
  const regions = getRegions();
  const groups = regions
    .map((region) => ({ region, trips: shown.filter((trip) => trip.regionSlug === region.slug) }))
    .filter((group) => group.trips.length > 0);
  // Safety net: a trip whose region is missing still shows, after the groups and without a title.
  const ungrouped = shown.filter((trip) => !regions.some((region) => region.slug === trip.regionSlug));

  function updateQuery(value: string) {
    setQuery(value);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value.trim()) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  /** ?kind= link that keeps the current search. */
  function kindSearch(value: TripKind | null): string {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query);
    if (value) next.set("kind", value);
    const search = next.toString();
    return search ? `?${search}` : "";
  }

  return (
    <div className="mx-auto max-w-6xl px-gutter py-16 sm:px-gutter-lg md:py-28">
      <header className="space-y-6">
        <Heading level="h1">{t("tripsPage.heading")}</Heading>
        <p className="max-w-prose text-fg-muted">{t("tripsPage.intro")}</p>
      </header>

      <div className="mt-14 flex flex-col gap-6 md:mt-20 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        {/* Without JavaScript this is a plain GET form: it reloads the page with ?q=. */}
        <Form
          method="get"
          role="search"
          replace
          preventScrollReset
          onSubmit={(event) => hydrated && event.preventDefault()}
          className="w-full max-w-md lg:max-w-sm"
        >
          <label htmlFor={searchId} className="sr-only">
            {t("tripsPage.search")}
          </label>
          <input
            id={searchId}
            type="search"
            name="q"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={t("tripsPage.searchPlaceholder")}
            autoComplete="off"
            className="min-h-tap w-full border-b border-border bg-transparent px-0 text-body text-fg transition-colors duration-(--duration-micro) placeholder:text-fg-muted hover:border-fg-muted focus-visible:border-accent"
          />
          {kind && <input type="hidden" name="kind" value={kind} />}
        </Form>

        {kinds.length > 1 && (
          <nav aria-label={t("tripsPage.filter")}>
            <ul className="-mx-3 flex flex-wrap">
              {[null, ...kinds].map((value) => {
                const current = value === kind;
                return (
                  <li key={value ?? "all"}>
                    <Link
                      to={{ pathname: TRIPS_PATH, search: kindSearch(value) }}
                      replace
                      preventScrollReset
                      aria-current={current ? "true" : undefined}
                      className={`eyebrow inline-flex min-h-tap items-center px-3 transition-colors duration-(--duration-micro) ${
                        current ? "bg-bg-raised text-fg" : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      {value ? t(`tripKind.${value}`) : t("tripsPage.all")}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>

      <p className="mt-6 not-italic text-small text-fg-muted" aria-live="polite">
        {shown.length === 1 ? t("tripsPage.countOne") : t("tripsPage.count", { count: shown.length })}
      </p>

      {shown.length > 0 ? (
        <div className="mt-16 space-y-24 md:mt-20 md:space-y-32">
          {groups.map(({ region, trips: regionTrips }) => (
            <section key={region.slug} aria-labelledby={`region-${region.slug}`}>
              <SectionTitle id={`region-${region.slug}`}>
                <Link
                  to={`/regions/${region.slug}`}
                  className="inline-flex items-center gap-4 transition-colors duration-(--duration-micro) hover:text-accent"
                >
                  {region.name}
                  <LinkArrow className="size-5 text-accent" />
                </Link>
              </SectionTitle>
              <p className="mt-3 max-w-prose text-fg-muted">{region.tagline}</p>
              <TripGrid trips={regionTrips} />
            </section>
          ))}
          {ungrouped.length > 0 && <TripGrid trips={ungrouped} />}
        </div>
      ) : (
        <div className="mt-10 space-y-2">
          <p>{t("tripsPage.empty")}</p>
          <Link to={{ pathname: TRIPS_PATH, search: "" }} replace onClick={() => setQuery("")} className={arrowLinkClasses}>
            {t("tripsPage.clear")}
          </Link>
        </div>
      )}
    </div>
  );
}

function TripGrid({ trips }: { trips: Trip[] }) {
  return (
    <ul className="mt-10 grid gap-x-10 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <li key={trip.slug}>
          <TripCard trip={trip} headingAs="h3" />
        </li>
      ))}
    </ul>
  );
}
