import { guide } from "~/content";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

export function AboutScreen() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-14 sm:px-6">
      <h1 className="text-4xl">{t("about.heading")}</h1>
      <img
        src={assetUrl(guide.portrait.src)}
        alt={guide.portrait.alt}
        className="aspect-[4/3] w-full rounded-xl object-cover"
      />
      <p className="text-ink-soft">{t("about.basedIn", { place: guide.basedIn })}</p>
      {guide.bio.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <dl className="space-y-3">
        <div>
          <dt className="font-semibold">{t("about.languages")}</dt>
          <dd>{guide.languages.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-semibold">{t("about.specialties")}</dt>
          <dd>{guide.specialties.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-semibold">{t("about.certifications")}</dt>
          <dd>{guide.certifications.map((c) => `${c.name} (${c.issuer})`).join(", ")}</dd>
        </div>
      </dl>
    </div>
  );
}
