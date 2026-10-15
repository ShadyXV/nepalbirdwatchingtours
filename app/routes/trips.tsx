import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { TripsScreen } from "~/screens";

export function meta() {
  return [
    { title: `${t("tripsPage.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("tripsPage.metaDescription") },
  ];
}

export default function Trips() {
  return <TripsScreen />;
}
