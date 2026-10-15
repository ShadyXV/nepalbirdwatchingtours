import { getRegion } from "~/content";
import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { RegionScreen } from "~/screens";
import type { Route } from "./+types/region";

export function meta({ params }: Route.MetaArgs) {
  const region = getRegion(params.regionSlug);
  if (!region) return [{ title: `404 | ${SITE_NAME}` }];
  return [
    { title: `${region.name} | ${SITE_NAME}` },
    { name: "description", content: t("region.metaDescription", { name: region.name, tagline: region.tagline }) },
  ];
}

/** /regions/<slug>/: unknown regions, and regions hidden because they have no trips yet, are a 404. */
export default function RegionPage({ params }: Route.ComponentProps) {
  const region = getRegion(params.regionSlug);
  if (!region) throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  return <RegionScreen region={region} />;
}
