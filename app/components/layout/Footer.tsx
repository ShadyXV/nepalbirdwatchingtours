import { Link } from "react-router";
import { guide } from "~/content";
import { t } from "~/i18n";
import { instagramUrl, mailtoUrl, whatsappUrl } from "../inquiry/channels";
import { useInquiry } from "../inquiry";
import { Button } from "../ui/Button";

export function Footer() {
  const { openInquiry } = useInquiry();
  const { contact } = guide;
  return (
    <footer className="border-t border-ink/10 bg-paper-deep px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">{guide.brand}</p>
          <p className="text-sm text-ink-soft">{guide.name}</p>
        </div>
        <div>
          <h2 className="mb-2 text-base">{t("footer.contact")}</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a className="hover:underline" href={whatsappUrl(contact)} target="_blank" rel="noopener noreferrer">
                {t("inquiry.whatsapp")}
              </a>
            </li>
            <li>
              <a className="hover:underline" href={mailtoUrl(contact)}>
                {t("inquiry.email")}
              </a>
            </li>
            <li>
              <a className="hover:underline" href={instagramUrl(contact)} target="_blank" rel="noopener noreferrer">
                {t("inquiry.instagram")}
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Button onClick={() => openInquiry()}>{t("nav.inquire")}</Button>
          <Link to="/privacy" className="text-sm hover:underline">
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
