import { Link } from "react-router";
import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { useInquiry } from "../inquiry";
import { Button } from "../ui/Button";

export function Header() {
  const { openInquiry } = useInquiry();
  return (
    <header className="sticky top-0 z-30 flex h-header items-center justify-between gap-4 border-b border-ink/10 bg-paper/95 px-4 backdrop-blur sm:px-6">
      <Link to="/" className="font-display text-lg font-semibold" aria-label={`${SITE_NAME}: ${t("nav.home")}`}>
        {SITE_NAME}
      </Link>
      <nav aria-label={t("nav.primary")} className="flex items-center gap-4 text-sm font-medium sm:gap-6">
        <Link to="/#trips" className="hover:underline">
          {t("nav.trips")}
        </Link>
        <Link to="/about" className="hover:underline">
          {t("nav.about")}
        </Link>
        <Button onClick={() => openInquiry()} className="px-4 py-1.5">
          {t("nav.inquire")}
        </Button>
      </nav>
    </header>
  );
}
