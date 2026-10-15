import { useEffect, useId, useState } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { MediaFrame } from "~/components/media";
import { arrowLinkClasses, Heading } from "~/components/ui";
import { getPublishedTrips, speciesCountForTrip } from "~/content";
import type { Trip, TripKind } from "~/content/types";
import { t } from "~/i18n";
import { useHydrated } from "~/lib/useHydrated";

/** Filter order; only kinds that have a published trip are offered. */
const KIND_ORDER: TripKind[] = ["birding-trek", "day-tour", "wildlife-safari", "trek-support"];

const isKind = (value: string | null): value is TripKind => KIND_ORDER.includes(value as TripKind);

/**
 * /trips/: every published trip as a card. Search by name (?q=) and filter by kind (?kind=). The
 * prerendered page (and any visit without JavaScript) shows the full list; filtering starts once
 * the page is hydrated, so the server HTML and the first client render always match.
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
                      to={{ search: kindSearch(value) }}
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
        <ul className="mt-10 grid gap-x-10 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((trip) => (
            <li key={trip.slug}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 space-y-2">
          <p>{t("tripsPage.empty")}</p>
          <Link to={{ search: "" }} replace onClick={() => setQuery("")} className={arrowLinkClasses}>
            {t("tripsPage.clear")}
          </Link>
        </div>
      )}
    </div>
  );
}

/** A trip as a card: cover, name, tagline, and one quiet line of facts (days, highest point, birds). */
function TripCard({ trip }: { trip: Trip }) {
  const facts = [
    trip.durationDays === 1 ? t("tripsPage.day") : t("tripsPage.days", { count: trip.durationDays }),
    `${trip.maxAltitudeM.toLocaleString("en")} m`,
    t("tripsPage.birds", { count: speciesCountForTrip(trip, "bird") }),
  ];

  return (
    <Link to={`/trips/${trip.slug}`} className="group block">
      <MediaFrame asset={trip.cover} />
      <Heading level="h3" as="h2" className="mt-5 transition-colors duration-(--duration-micro) group-hover:text-accent">
        {trip.title}
      </Heading>
      <p className="mt-3 text-fg-muted">{trip.tagline}</p>
      <p className="eyebrow mt-4 text-fg-muted">{facts.join(" · ")}</p>
    </Link>
  );
}
