import { HomeScreen } from "~/screens";
import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";

export function meta() {
  return [
    { title: `${t("home.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("site.description") },
  ];
}

export default function Home() {
  return <HomeScreen />;
}
