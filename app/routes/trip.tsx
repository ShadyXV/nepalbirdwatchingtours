import { getTrip } from "~/content";
import { SITE_NAME } from "~/lib/site";
import { TripScreen } from "~/screens";
import type { Route } from "./+types/trip";

export function meta({ params }: Route.MetaArgs) {
  const trip = getTrip(params.slug);
  if (!trip) return [{ title: `404 | ${SITE_NAME}` }];
  return [
    { title: `${trip.title} | ${SITE_NAME}` },
    { name: "description", content: trip.summary },
  ];
}

export default function Trip({ params }: Route.ComponentProps) {
  const trip = getTrip(params.slug);
  if (!trip) throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  return <TripScreen trip={trip} />;
}
