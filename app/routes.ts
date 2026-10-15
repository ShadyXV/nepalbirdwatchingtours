import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  layout("routes/map-layout.tsx", [
    index("routes/home.tsx"),
    route("trips/:slug", "routes/trip.tsx"),
    route("regions/:regionSlug", "routes/region.tsx"),
    route("places/:placeId", "routes/place.tsx"),
  ]),
  // The trip list sits outside the map layout (like /about); single trips (/trips/:slug) stay inside it.
  route("trips", "routes/trips.tsx"),
  route("reviews", "routes/reviews.tsx"),
  route("trip-reports/:slug", "routes/trip-report.tsx"),
  route("anywhere", "routes/anywhere.tsx"),
  route("birding-in-nepal", "routes/birding-in-nepal.tsx"),
  route("about", "routes/about.tsx"),
  route("privacy", "routes/privacy.tsx"),
  // Dev-only inspection page for the contour texture; never part of the build.
  ...(import.meta.env.DEV ? [route("lab/terrain", "routes/lab.terrain.tsx")] : []),
] satisfies RouteConfig;
