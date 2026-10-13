import type { Config } from "@react-router/dev/config";
import { getPlaces } from "./app/content";
import { trips } from "./app/content/data/trips";

export default {
  appDirectory: "app",
  // Static SPA-mode site: every route is prerendered to HTML, the rest falls back to the SPA shell.
  ssr: false,
  basename: process.env.BASE_PATH ?? "/",
  prerender: () => [
    "/",
    "/anywhere",
    "/about",
    "/privacy",
    ...trips.filter((t) => t.status === "published").map((trip) => `/trips/${trip.slug}`),
    ...getPlaces().map((place) => `/places/${place.id}`),
  ],
} satisfies Config;
