import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { BirdingInNepalScreen } from "~/screens";

export function meta() {
  return [
    { title: `${t("birdingGuide.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("birdingGuide.metaDescription") },
  ];
}

export default function BirdingInNepal() {
  return <BirdingInNepalScreen />;
}
