import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { ReviewsScreen } from "~/screens";

export function meta() {
  return [
    { title: `${t("reviewsPage.metaTitle")} | ${SITE_NAME}` },
    { name: "description", content: t("reviewsPage.metaDescription") },
  ];
}

export default function Reviews() {
  return <ReviewsScreen />;
}
