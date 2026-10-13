import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { AnywhereScreen } from "~/screens";

export function meta() {
  return [
    { title: `${t("anywhere.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("anywhere.metaDescription") },
  ];
}

export default function Anywhere() {
  return <AnywhereScreen />;
}
