import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { ReviewCard } from "~/components/reviews";
import { TripReportCard } from "~/components/tripReport";
import { Button, buttonClasses, SectionTitle } from "~/components/ui";
import { contactBanner, getReviewsNewestFirst, getTripReports, guide, homeWays } from "~/content";
import type { HomeWay, MediaAsset } from "~/content/types";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

/** Page column for the quieter sections. */
const column = "mx-auto max-w-5xl px-gutter sm:px-gutter-lg";
const textLink = "eyebrow inline-flex min-h-tap items-center text-accent underline hover:text-fg";

/**
 * Home, below the map: a short way in to the trips (in the map's peek), then Krishna, the three ways
 * to go birding, the contact band, reviews and recent trip reports. Section titles use the calm
 * accent treatment (SectionTitle), not the display caps.
 */
export function HomeScreen() {
  const reviews = getReviewsNewestFirst().slice(0, 3);
  const reports = getTripReports().slice(0, 3);

  return (
    <div className="space-y-20 pb-20 md:space-y-28 md:pb-28">
      <HeroIntro />
      <GuideIntro />
      <Ways />
      <ContactBand />

      <section aria-labelledby="home-reviews" className={column}>
        <SectionTitle id="home-reviews">{t("home.reviewsHeading")}</SectionTitle>
        <ul className="mt-8 grid gap-12 lg:grid-cols-3 lg:gap-10">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
        <Link to="/reviews" className={`${textLink} mt-8`}>
          {t("home.reviewsAll")}
        </Link>
      </section>

      {reports.length > 0 && (
        <section aria-labelledby="home-reports" className={column}>
          <SectionTitle id="home-reports">{t("home.reportsHeading")}</SectionTitle>
          <ul className="mt-8 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {reports.map((report) => (
              <li key={report.slug}>
                <TripReportCard report={report} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Sits in the map's peek: one line and the way to the full trip list. */
function HeroIntro() {
  return (
    <div className={`${column} pt-2 md:flex md:items-center md:justify-between md:gap-10`}>
      <h1 className="sr-only">{t("home.metaTitle")}</h1>
      <p className="accent max-w-2xl text-section-sm">{t("home.heroLine")}</p>
      <Link to="/trips" className={buttonClasses("primary", "md", "mt-6 w-full shrink-0 md:mt-0 md:w-auto")}>
        {t("home.heroCta")}
      </Link>
    </div>
  );
}

function GuideIntro() {
  return (
    <section aria-labelledby="home-guide" className={`${column} grid items-center gap-8 md:grid-cols-[16rem_1fr] md:gap-12`}>
      <img
        src={assetUrl(guide.portrait.src)}
        alt={guide.portrait.alt}
        loading="lazy"
        decoding="async"
        className="aspect-[3/2] w-full rounded-card object-cover md:aspect-square"
      />
      <div>
        <SectionTitle id="home-guide">{t("home.introHeading")}</SectionTitle>
        <p className="mt-5 max-w-prose">{t("home.introBody", { years: guide.yearsGuiding ?? 6 })}</p>
        <Link to="/about" className={`${textLink} mt-4`}>
          {t("home.introLink")}
        </Link>
      </div>
    </section>
  );
}

/** The three main ways to go birding: each a block about a screen tall, photo ¾ and text ¼, side by side from lg. */
function Ways() {
  return (
    <section aria-labelledby="home-ways" className="mx-auto max-w-7xl px-gutter sm:px-gutter-lg">
      <SectionTitle id="home-ways">{t("home.servicesHeading")}</SectionTitle>
      <ul className="mt-8 space-y-16 lg:mt-10 lg:space-y-12">
        {homeWays.map((way, i) => (
          <li key={way.id}>
            <WayBlock way={way} flipped={i % 2 === 1} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function WayBlock({ way, flipped }: { way: HomeWay; flipped: boolean }) {
  const titleId = `home-way-${way.id}`;
  const { image } = way;
  return (
    <article
      aria-labelledby={titleId}
      className={`grid gap-6 lg:h-[calc(100svh_-_var(--spacing-header)_-_4rem)] lg:max-h-[56rem] lg:min-h-[32rem] lg:gap-10 ${
        flipped ? "lg:grid-cols-[1fr_3fr]" : "lg:grid-cols-[3fr_1fr]"
      }`}
    >
      <img
        src={assetUrl(image.src)}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className={`h-[58svh] min-h-72 w-full rounded-card bg-bg-raised object-cover lg:h-full lg:min-h-0 ${flipped ? "lg:order-2" : ""}`}
        style={image.focal ? { objectPosition: `${image.focal[0] * 100}% ${image.focal[1] * 100}%` } : undefined}
      />
      <div className="flex flex-col lg:justify-end lg:pb-2">
        <SectionTitle as="h3" size="md" id={titleId}>
          {t(`home.services.${way.id}.title`)}
        </SectionTitle>
        <p className="mt-4 max-w-prose">{t(`home.services.${way.id}.body`)}</p>
        <Link to={way.href} className={`${textLink} mt-3 self-start`}>
          {t(`home.services.${way.id}.link`)}
        </Link>
      </div>
    </article>
  );
}

/** Full-width photo band with a way to reach Krishna; opens the inquiry drawer. */
function ContactBand() {
  const { openInquiry } = useInquiry();
  return (
    <section aria-labelledby="home-contact" className="relative isolate overflow-hidden">
      <BandMedia asset={contactBanner} />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-bg via-scrim to-transparent" />
      <div className={`${column} flex min-h-[28rem] flex-col justify-end py-12 md:min-h-[36rem] md:items-start md:py-16`}>
        <SectionTitle id="home-contact">{t("home.contact.heading")}</SectionTitle>
        <p className="mt-4 max-w-prose">{t("home.contact.body")}</p>
        <Button className="mt-6 w-full md:w-auto" onClick={() => openInquiry()}>
          {t("home.contact.cta")}
        </Button>
      </div>
    </section>
  );
}

/**
 * The band's backdrop: an image, or a video's poster. When the band gets a clip (a VideoAsset in
 * content/data/home.ts), ambient playback goes here; until then the poster stands in.
 */
function BandMedia({ asset }: { asset: MediaAsset }) {
  const src = asset.kind === "image" ? asset.src : asset.poster;
  const focal = asset.kind === "image" ? asset.focal : undefined;
  return (
    <img
      src={assetUrl(src)}
      alt={asset.alt}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 -z-20 size-full object-cover"
      style={focal ? { objectPosition: `${focal[0] * 100}% ${focal[1] * 100}%` } : undefined}
    />
  );
}
