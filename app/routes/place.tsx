import { getPlace } from "~/content";
import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { PlaceScreen } from "~/screens";
import type { Route } from "./+types/place";

export function meta({ params }: Route.MetaArgs) {
  const place = getPlace(params.placeId);
  if (!place) return [{ title: `404 | ${SITE_NAME}` }];
  return [
    { title: `${place.name} | ${SITE_NAME}` },
    { name: "description", content: place.blurb ?? t("place.metaDescription", { name: place.name }) },
  ];
}

export default function Place({ params }: Route.ComponentProps) {
  const place = getPlace(params.placeId);
  if (!place) throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  return <PlaceScreen place={place} />;
}
