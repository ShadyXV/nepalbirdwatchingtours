import { useEffect, useId, useState } from "react";
import { Form, Link, useSearchParams } from "react-router";
import { MediaFrame } from "~/components/media";
import { Heading } from "~/components/ui";
import { getPublishedTrips, speciesCountForTrip } from "~/content";
import type { Trip, TripKind } from "~/content/types";
import { t } from "~/i18n";
import { monthName } from "~/lib/format";
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
    <div className="mx-auto max-w-6xl space-y-10 px-gutter py-12 sm:px-gutter-lg md:py-20">
      <header className="space-y-4">
        <Heading level="h1">{t("tripsPage.heading")}</Heading>
        <p className="max-w-prose text-fg-muted">{t("tripsPage.intro")}</p>
      </header>

      <div className="space-y-4">
        {/* Without JavaScript this is a plain GET form: it reloads the page with ?q=. */}
        <Form method="get" role="search" replace preventScrollReset onSubmit={(event) => hydrated && event.preventDefault()}>
          <label htmlFor={searchId} className="eyebrow mb-2 block text-fg-muted">
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
            className="min-h-tap w-full max-w-md rounded-field border border-border bg-bg-raised px-4 text-body text-fg placeholder:text-fg-muted"
          />
          {kind && <input type="hidden" name="kind" value={kind} />}
        </Form>

        {kinds.length > 1 && (
          <nav aria-label={t("tripsPage.filter")}>
            <ul className="flex flex-wrap gap-2">
              {[null, ...kinds].map((value) => {
                const current = value === kind;
                return (
                  <li key={value ?? "all"}>
                    <Link
                      to={{ search: kindSearch(value) }}
                      replace
                      preventScrollReset
                      aria-current={current ? "true" : undefined}
                      className={`eyebrow inline-flex min-h-tap items-center rounded-button border px-4 transition-colors duration-(--duration-micro) ${
                        current ? "border-fg bg-fg text-bg" : "border-border text-fg hover:border-fg"
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

        <p className="eyebrow text-fg-muted" aria-live="polite">
          {shown.length === 1 ? t("tripsPage.countOne") : t("tripsPage.count", { count: shown.length })}
        </p>
      </div>

      {shown.length > 0 ? (
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((trip) => (
            <li key={trip.slug}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          <p>{t("tripsPage.empty")}</p>
          <Link
            to={{ search: "" }}
            replace
            onClick={() => setQuery("")}
            className="eyebrow inline-flex min-h-tap items-center text-accent underline hover:text-fg"
          >
            {t("tripsPage.clear")}
          </Link>
        </div>
      )}
    </div>
  );
}

/** A trip as a card: cover, kind, name, tagline and the useful facts at a glance. */
function TripCard({ trip }: { trip: Trip }) {
  const days = trip.durationDays === 1 ? t("tripsPage.day") : t("tripsPage.days", { count: trip.durationDays });
  const facts: [string, string][] = [
    [t("tripsPage.duration"), days],
    [t("tripsPage.region"), trip.region],
    [t("tripsPage.difficulty"), t(`difficulty.${trip.difficulty}`)],
    [t("tripsPage.maxAltitude"), `${trip.maxAltitudeM.toLocaleString("en")} m`],
    [t("tripsPage.birds"), String(speciesCountForTrip(trip, "bird"))],
    [t("tripsPage.bestMonths"), trip.bestMonths.map(monthName).join(", ")],
  ];

  return (
    <article className="flex h-full flex-col">
      <Link to={`/trips/${trip.slug}`} className="group block">
        <MediaFrame asset={trip.cover} className="rounded-card" />
        <p className="eyebrow mt-4 text-accent">{t(`tripKind.${trip.kind}`)}</p>
        <Heading level="h3" as="h2" className="mt-2 group-hover:text-accent">
          {trip.title}
        </Heading>
      </Link>
      <p className="mt-2 text-small text-fg-muted">{trip.tagline}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="eyebrow text-fg-muted">{label}</dt>
            <dd className="mt-0.5 text-small">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
