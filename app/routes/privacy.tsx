import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { PrivacyScreen } from "~/screens";

export function meta() {
  return [
    { title: `${t("privacy.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("privacy.description") },
  ];
}

export default function Privacy() {
  return <PrivacyScreen />;
}
