import type { CSSProperties } from "react";
import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { ReviewCard } from "~/components/reviews";
import { StoryButton, useStoryUp } from "~/components/story";
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
  const storyUp = useStoryUp();

  return (
    <>
      <StoryButton up={storyUp} targetId="intro" />
      <HeroIntro />
      {/* Top padding clears the story button on the seam; the intro's top is what peeks under the map. */}
      <div className="space-y-28 pt-12 pb-28 md:space-y-40 md:pt-14 md:pb-40">
        <GuideIntro />
        {/* Stitched: the last service photo fades into the contact band's faded top, no gap between. */}
        <div>
          <Ways />
          <ContactBand />
        </div>

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
    </>
  );
}

/**
 * The quiet second way in to the trips (tapping a pin is the first): a short dimmed line and
 * "Browse all trips", on the map's bottom-left corner. It hangs above the sheet's top edge, which
 * a little above the fold (MAP_LAYOUT home peek), so it is on the first screen and scrolls away with
 * the page; the camera keeps the pins clear of it (MAP_LAYOUT.homeCornerRem). On phones it sits
 * higher, clear of the story button in the middle of the seam.
 */
function HeroIntro() {
  return (
    <div className="relative">
      <h1 className="sr-only">{t("home.metaTitle")}</h1>
      <div data-map-avoid="" className="absolute bottom-full left-0 flex flex-col items-start gap-3 px-gutter pb-12 sm:px-gutter-lg md:pb-7">
        <p className="text-small text-fg-muted [text-shadow:var(--text-shadow-map-label)]">{t("home.heroLine")}</p>
        <Link to="/trips/" className={buttonClasses("primary", "md")}>
          {t("home.heroCta")}
        </Link>
      </div>
    </div>
  );
}

/**
 * Soft edges that keep the photo's shape: an eased fade on each side (no straight ramp, so no fade
 * line shows), the two axes multiplied so the corners round off gently.
 */
const portraitVignette =
  "[mask-image:linear-gradient(to_right,transparent_0%,rgb(0_0_0/0.1)_5%,rgb(0_0_0/0.35)_11%,rgb(0_0_0/0.7)_18%,#000_26%,#000_74%,rgb(0_0_0/0.7)_82%,rgb(0_0_0/0.35)_89%,rgb(0_0_0/0.1)_95%,transparent_100%),linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.1)_5%,rgb(0_0_0/0.35)_11%,rgb(0_0_0/0.7)_18%,#000_26%,#000_74%,rgb(0_0_0/0.7)_82%,rgb(0_0_0/0.35)_89%,rgb(0_0_0/0.1)_95%,transparent_100%)] [mask-composite:intersect]";

function GuideIntro() {
  return (
    <section id="intro" aria-labelledby="home-guide" className={`${column} grid items-center gap-10 md:grid-cols-[18rem_1fr] md:gap-16`}>
      {/* A portrait frame, so Krishna is never cropped hard; its edges melt into the page and the middle
          (face and gear) stays fully clear. */}
      <MediaFrame asset={guide.portrait} aspect="4 / 5" className={`w-full max-w-72 md:max-w-none ${portraitVignette}`} />
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
 * What we offer: led tours, day tours, a birding specialist on treks, as one continuous strip.
 * Each photo runs to the window edge on its side (alternating) and dissolves into the page on its
 * inner edge, top and bottom, the same way the contact band below melts into the page. The blocks
 * keep a little dark space between them (owner: overlapping photos looked crowded), so each photo
 * fades out fully before the next fades in, with no hard edges.
 * Desktop: the photo takes the larger share, the text sits beside it on the page column's edge.
 * Phones: the photo spans the full width and fades down into its text.
 */
function Ways() {
  return (
    <section id="services" aria-labelledby="home-ways">
      <div className={column}>
        <SectionTitle id="home-ways">{t("home.servicesHeading")}</SectionTitle>
      </div>
      <ul className="mt-8 flex flex-col gap-14 sm:gap-16 lg:mt-2 lg:gap-2.5">
        {homeWays.map((way, i) => (
          <li key={way.id}>
            <WayBlock way={way} flipped={i % 2 === 1} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The photo's share of the page column on desktop; the text takes the rest. */
const WAY_IMAGE_SHARE = 0.54;

/*
 * Desktop photo width: from the window edge to the share line in the page column, plus the text's
 * inset (ps-10 / pe-10), which the photo has fully faded out by. Mirrors `column`
 * (max-w-5xl, px-gutter-lg).
 */
const wayLayoutVars = {
  "--way-image-w": `calc((100% - min(100%, var(--container-5xl))) / 2 + var(--spacing-gutter-lg) + (min(100%, var(--container-5xl)) - 2 * var(--spacing-gutter-lg)) * ${WAY_IMAGE_SHARE} + var(--spacing) * 10)`,
  "--way-text-inset": `${WAY_IMAGE_SHARE * 100}%`,
} as CSSProperties;

/** Edge fades (static masks): phones fade top and bottom; desktop also dissolves the inner edge. */
const wayImageFade = "mask-t-from-85% mask-b-from-60% lg:mask-t-from-75% lg:mask-b-from-75%";

function WayBlock({ way, flipped }: { way: HomeWay; flipped: boolean }) {
  const titleId = `home-way-${way.id}`;
  const { image } = way;
  return (
    <article aria-labelledby={titleId} className="relative lg:flex lg:min-h-[36rem] lg:items-center" style={wayLayoutVars}>
      <img
        src={assetUrl(image.src)}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className={[
          "aspect-[4/3] w-full bg-bg-raised object-cover sm:aspect-[2/1]",
          "lg:absolute lg:inset-y-0 lg:aspect-auto lg:h-full lg:w-(--way-image-w)",
          wayImageFade,
          flipped ? "lg:right-0 lg:mask-l-from-45%" : "lg:left-0 lg:mask-r-from-45%",
        ].join(" ")}
        style={image.focal ? { objectPosition: `${image.focal[0] * 100}% ${image.focal[1] * 100}%` } : undefined}
      />
      <div className={`${column} relative lg:w-full lg:py-24`}>
        <div className={flipped ? "lg:me-(--way-text-inset) lg:pe-10" : "lg:ms-(--way-text-inset) lg:ps-10"}>
          <SectionTitle as="h3" size="md" id={titleId}>
            {t(`home.services.${way.id}.title`)}
          </SectionTitle>
          <p className="mt-5 max-w-prose">{t(`home.services.${way.id}.body`)}</p>
          <ArrowLink to={way.href} className="mt-5">
            {t(`home.services.${way.id}.link`)}
          </ArrowLink>
        </div>
      </div>
    </article>
  );
}

/**
 * Full-width photo band with a way to reach Krishna; opens the inquiry drawer. A pause after the
 * services marks it as a new section; it rises out of the night (a long dark wash over the photo's
 * pale sky, so no grey stripe shows) and fades into the page at the bottom, into the reviews.
 */
function ContactBand() {
  const { openInquiry } = useInquiry();
  return (
    <section aria-labelledby="home-contact" className="relative isolate mt-20 overflow-hidden sm:mt-24">
      <BandMedia asset={contactBanner} />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[37.5%] bg-linear-to-b from-bg to-transparent" />
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
      className="absolute inset-0 -z-20 size-full object-cover mask-t-from-81%"
      style={focal ? { objectPosition: `${focal[0] * 100}% ${focal[1] * 100}%` } : undefined}
    />
  );
}
