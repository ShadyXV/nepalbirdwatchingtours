import type { Config } from "@react-router/dev/config";
import { getPlaces, getRegions, getTripReports } from "./app/content";
import { trips } from "./app/content/data/trips";

export default {
  appDirectory: "app",
  // Static SPA-mode site: every route is prerendered to HTML, the rest falls back to the SPA shell.
  ssr: false,
  basename: process.env.BASE_PATH ?? "/",
  prerender: () => [
    "/",
    "/trips",
    "/reviews",
    "/anywhere",
    "/birding-in-nepal",
    "/about",
    "/privacy",
    ...trips.filter((t) => t.status === "published").map((trip) => `/trips/${trip.slug}`),
    ...getRegions().map((region) => `/regions/${region.slug}`),
    ...getPlaces().map((place) => `/places/${place.id}`),
    ...getTripReports().map((report) => `/trip-reports/${report.slug}`),
  ],
} satisfies Config;
