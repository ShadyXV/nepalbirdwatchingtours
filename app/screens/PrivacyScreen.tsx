import { t } from "~/i18n";
import { en } from "~/i18n/en";

export function PrivacyScreen() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 sm:px-6">
      <h1 className="text-4xl">{t("privacy.heading")}</h1>
      {en.privacy.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
