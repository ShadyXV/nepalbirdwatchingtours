import { Link } from "react-router";
import { guide } from "~/content";
import { t } from "~/i18n";
import { instagramUrl, mailtoUrl, whatsappUrl } from "../inquiry/channels";
import { useInquiry } from "../inquiry";
import { Button } from "../ui/Button";

const link = "inline-flex min-h-tap items-center hover:text-accent hover:underline";

export function Footer() {
  const { openInquiry } = useInquiry();
  const { contact } = guide;
  return (
    <footer className="border-t border-border bg-bg-raised px-gutter pb-10 pt-10 sm:px-gutter-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:justify-between">
        <div>
          <p className="font-display text-h3 uppercase">{guide.brand}</p>
          <p className="mt-1 not-italic text-small text-fg-muted">{guide.name}</p>
        </div>
        <nav aria-label={t("footer.explore")}>
          <h2 className="eyebrow mb-1 font-mono text-fg-muted">{t("footer.explore")}</h2>
          <ul>
            <li>
              <Link className={link} to="/trips">
                {t("nav.trips")}
              </Link>
            </li>
            <li>
              <Link className={link} to="/reviews">
                {t("nav.reviews")}
              </Link>
            </li>
            <li>
              <Link className={link} to="/anywhere">
                {t("nav.anywhere")}
              </Link>
            </li>
            <li>
              <Link className={link} to="/birding-in-nepal">
                {t("nav.birdingInNepal")}
              </Link>
            </li>
            <li>
              <Link className={link} to="/about">
                {t("nav.about")}
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="eyebrow mb-1 font-mono text-fg-muted">{t("footer.contact")}</h2>
          <ul>
            <li>
              <a className={link} href={whatsappUrl(contact)} target="_blank" rel="noopener noreferrer">
                {t("inquiry.whatsapp")}
              </a>
            </li>
            <li>
              <a className={link} href={mailtoUrl(contact)}>
                {t("inquiry.email")}
              </a>
            </li>
            <li>
              <a className={link} href={instagramUrl(contact)} target="_blank" rel="noopener noreferrer">
                {t("inquiry.instagram")}
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-start">
          <Button onClick={() => openInquiry()}>{t("nav.inquire")}</Button>
          <Link to="/privacy" className={link}>
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
      <p className="not-italic mx-auto mt-10 max-w-5xl text-small text-fg-muted">{t("footer.mapCredits")}</p>
    </footer>
  );
}
