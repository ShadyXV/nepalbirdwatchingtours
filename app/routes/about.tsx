import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { AboutScreen } from "~/screens";

export function meta() {
  return [
    { title: `${t("about.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("site.description") },
  ];
}

export default function About() {
  return <AboutScreen />;
}
