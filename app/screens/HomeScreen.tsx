import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { ReviewCard } from "~/components/reviews";
import { TripReportCard } from "~/components/tripReport";
import { Carousel, MediaFrame } from "~/components/media";
import { ArrowLink, Button, buttonClasses, SectionTitle } from "~/components/ui";
import { contactBanner, getReviewsNewestFirst, getTripReports, guide, homeWays } from "~/content";
import type { HomeWay, MediaAsset } from "~/content/types";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

/** Page column for the quieter sections. */
const column = "mx-auto max-w-5xl px-gutter sm:px-gutter-lg";

/**
 * Home, below the map: a short way in to the trips (in the map's peek), then Krishna, what we offer,
 * the contact band, reviews and recent trip reports. One idea per screen, with plenty of air between
 * them. Section titles use the calm accent treatment (SectionTitle), not the display caps.
 */
export function HomeScreen() {
  const reviews = getReviewsNewestFirst();
  const reports = getTripReports().slice(0, 3);

  return (
    <div className="space-y-28 pb-28 md:space-y-40 md:pb-40">
      <HeroIntro />
      <GuideIntro />
      <Ways />
      <ContactBand />

      {/* One review at a time on phones, two side by side from md; native scroll-snap, so it swipes without JS. */}
      <section id="reviews" aria-labelledby="home-reviews" className={column}>
        <SectionTitle id="home-reviews">{t("home.reviewsHeading")}</SectionTitle>
        <Carousel
          label={t("home.reviewsHeading")}
          slideClassName="basis-full md:basis-[calc(50%-2rem)]"
          gapClassName="gap-gutter md:gap-16"
          className="mt-12 md:mt-16"
        >
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} className="max-w-prose" />
          ))}
        </Carousel>
        <ArrowLink to="/reviews" className="mt-8">
          {t("home.reviewsAll")}
        </ArrowLink>
      </section>

      {reports.length > 0 && (
        <section id="trip-reports" aria-labelledby="home-reports" className={column}>
          <SectionTitle id="home-reports">{t("home.reportsHeading")}</SectionTitle>
          <ul className="mt-12 grid gap-16 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-10">
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

/**
 * The quiet second way in to the trips (tapping a pin is the first): a short dimmed line and
 * "Browse all trips", on the map's bottom-left corner. It hangs above the sheet's top edge, which
 * sits at the fold (MAP_LAYOUT home peek 0), so it is on the first screen and scrolls away with the
 * page; the camera keeps the pins clear of it (MAP_LAYOUT.homeCornerRem).
 */
function HeroIntro() {
  return (
    <div className="relative mb-0 pb-12 md:pb-16">
      <h1 className="sr-only">{t("home.metaTitle")}</h1>
      <div data-map-avoid="" className="absolute bottom-full left-0 flex flex-col items-start gap-3 px-gutter pb-5 sm:px-gutter-lg md:pb-7">
        <p className="text-small text-fg-muted [text-shadow:var(--text-shadow-map-label)]">{t("home.heroLine")}</p>
        <Link to="/trips/" className={buttonClasses("primary", "md")}>
          {t("home.heroCta")}
        </Link>
      </div>
    </div>
  );
}

function GuideIntro() {
  return (
    <section aria-labelledby="home-guide" className={`${column} grid items-center gap-10 md:grid-cols-[18rem_1fr] md:gap-16`}>
      {/* A portrait frame, so Krishna's face (the photo's focal point) is never cropped hard. */}
      <MediaFrame asset={guide.portrait} aspect="4 / 5" className="w-full max-w-72 md:max-w-none" />
      <div>
        <SectionTitle id="home-guide">{t("home.introHeading")}</SectionTitle>
        <p className="mt-6 max-w-prose">{t("home.introBody", { years: guide.yearsGuiding ?? 6 })}</p>
        <ArrowLink to="/about" className="mt-6">
          {t("home.introLink")}
        </ArrowLink>
      </div>
    </section>
  );
}

/**
 * What we offer: led tours, day tours, a birding specialist on treks. Each block is a photo that runs
 * to the window edge on its side (alternating) with the text beside it; on phones the photo spans the
 * full width and the text sits below in the normal gutter.
 */
function Ways() {
  return (
    <section id="services" aria-labelledby="home-ways">
      <div className={column}>
        <SectionTitle id="home-ways">{t("home.servicesHeading")}</SectionTitle>
      </div>
      <ul className="mt-12 space-y-24 md:mt-16 lg:space-y-32">
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
      className={`grid gap-8 lg:items-center lg:gap-0 ${flipped ? "lg:grid-cols-[9fr_11fr]" : "lg:grid-cols-[11fr_9fr]"}`}
    >
      <img
        src={assetUrl(image.src)}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className={`aspect-[3/2] w-full bg-bg-raised object-cover sm:aspect-[2/1] lg:aspect-[16/10] lg:max-h-[30rem] ${flipped ? "lg:order-2" : ""}`}
        style={image.focal ? { objectPosition: `${image.focal[0] * 100}% ${image.focal[1] * 100}%` } : undefined}
      />
      <div className="px-gutter sm:px-gutter-lg lg:px-16 xl:px-24">
        <SectionTitle as="h3" size="md" id={titleId}>
          {t(`home.services.${way.id}.title`)}
        </SectionTitle>
        <p className="mt-5 max-w-prose lg:max-w-md">{t(`home.services.${way.id}.body`)}</p>
        <ArrowLink to={way.href} className="mt-5">
          {t(`home.services.${way.id}.link`)}
        </ArrowLink>
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
