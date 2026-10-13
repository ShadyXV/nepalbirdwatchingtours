import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  layout("routes/map-layout.tsx", [
    index("routes/home.tsx"),
    route("trips/:slug", "routes/trip.tsx"),
    route("places/:placeId", "routes/place.tsx"),
  ]),
  route("anywhere", "routes/anywhere.tsx"),
  route("about", "routes/about.tsx"),
  route("privacy", "routes/privacy.tsx"),
] satisfies RouteConfig;
