import { MediaFrame } from "~/components/media";
import { Heading } from "~/components/ui";
import { guide } from "~/content";
import { t } from "~/i18n";

export function AboutScreen() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-gutter py-12 sm:px-gutter-lg md:py-20">
      <Heading level="h1">{t("about.heading")}</Heading>
      {/* Portrait frame that honours the photo's focal point (his face). */}
      <MediaFrame asset={guide.portrait} aspect="4 / 5" className="w-full max-w-md" />
      <p className="eyebrow text-fg-muted">{t("about.basedIn", { place: guide.basedIn })}</p>
      {guide.bio.map((paragraph) => (
        <p key={paragraph} className="max-w-prose">
          {paragraph}
        </p>
      ))}
      <dl className="space-y-5 border-t border-border pt-6">
        <div>
          <dt className="eyebrow text-fg-muted">{t("about.languages")}</dt>
          <dd className="mt-1">{guide.languages.join(", ")}</dd>
        </div>
        <div>
          <dt className="eyebrow text-fg-muted">{t("about.specialties")}</dt>
          <dd className="mt-1">{guide.specialties.join(", ")}</dd>
        </div>
        <div>
          <dt className="eyebrow text-fg-muted">{t("about.certifications")}</dt>
          <dd className="mt-1">{guide.certifications.map((c) => `${c.name} (${c.issuer})`).join(", ")}</dd>
        </div>
      </dl>
    </div>
  );
}
