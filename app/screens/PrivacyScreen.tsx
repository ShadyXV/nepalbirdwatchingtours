import { Heading } from "~/components/ui";
import { t } from "~/i18n";
import { en } from "~/i18n/en";

export function PrivacyScreen() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-gutter py-12 sm:px-gutter-lg md:py-20">
      <Heading level="h1">{t("privacy.heading")}</Heading>
      {en.privacy.body.map((paragraph) => (
        <p key={paragraph} className="max-w-prose">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
