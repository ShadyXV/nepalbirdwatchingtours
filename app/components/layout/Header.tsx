import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router";
import { t } from "~/i18n";
import { SITE_NAME } from "~/lib/site";
import { useInquiry } from "../inquiry";
import { Button } from "../ui/Button";

const links = [
  { to: "/trips", label: "nav.trips" },
  { to: "/anywhere", label: "nav.anywhere" },
  { to: "/birding-in-nepal", label: "nav.birdingInNepal" },
  { to: "/about", label: "nav.about" },
] as const;

export function Header() {
  const { openInquiry } = useInquiry();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();

  // Close the sheet on navigation and on Escape.
  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex h-header items-center justify-between gap-3 px-gutter sm:px-gutter-lg">
        <Link
          to="/"
          className="min-w-0 font-display text-h3 uppercase leading-none tracking-[0.02em]"
          aria-label={`${SITE_NAME}: ${t("nav.home")}`}
        >
          {SITE_NAME}
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:gap-5 lg:gap-8">
          <nav aria-label={t("nav.primary")} className="hidden items-center gap-5 md:flex lg:gap-8">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="eyebrow inline-flex min-h-tap items-center hover:text-accent">
                {t(link.label)}
              </Link>
            ))}
          </nav>
          <Button size="sm" onClick={() => openInquiry()}>
            {t("nav.inquire")}
          </Button>
          <button
            type="button"
            className="inline-flex size-tap items-center justify-center border border-border text-fg md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t("nav.menuClose") : t("nav.menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round">
              {menuOpen ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id={menuId}
          aria-label={t("nav.primary")}
          className="absolute inset-x-0 top-full border-b border-border bg-bg-raised px-gutter pb-4 pt-2 shadow-card md:hidden"
        >
          <ul>
            {links.map((link) => (
              <li key={link.to} className="border-b border-border last:border-b-0">
                <Link to={link.to} className="flex min-h-14 items-center font-display text-h2 uppercase" onClick={() => setMenuOpen(false)}>
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
