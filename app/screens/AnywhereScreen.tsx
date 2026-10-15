import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { Button, Heading, inlineLinkClasses, LabelledMediaCarousel } from "~/components/ui";
import { getOfferings, getPlace, getReviewsForOffering, getTrip } from "~/content";
import type { Offering, Review } from "~/content/types";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

const forYouList = new Intl.ListFormat("en", { style: "long", type: "disjunction" });

/** "Anywhere": one full-bleed, photo-led section per offering, each an anchor (/anywhere/#<id>). */
export function AnywhereScreen() {
  const { openInquiry } = useInquiry();
  const offerings = getOfferings();

  return (
    <div>
      <Hero offerings={offerings} />
      {offerings.map((offering, index) => (
        <OfferingSection key={offering.id} offering={offering} tinted={index % 2 === 1} />
      ))}
      <section className="px-gutter py-16 text-center sm:px-gutter-lg">
        <div className="mx-auto max-w-2xl space-y-4">
          <Heading level="h1">{t("anywhere.closingHeading")}</Heading>
          <p className="text-fg-muted">{t("anywhere.closingBody")}</p>
          <Button className="w-full md:w-auto" onClick={() => openInquiry()}>
            {t("anywhere.closingCta")}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Hero({ offerings }: { offerings: Offering[] }) {
  return (
    <header className="relative isolate overflow-hidden px-gutter pb-10 pt-12 sm:px-gutter-lg md:pb-16 md:pt-20">
      {/* Decorative backdrop; the real photo is swapped in later. */}
      <img
        src={assetUrl("/media/placeholder-ridge.svg")}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-b from-scrim to-bg" />
      <div className="mx-auto max-w-5xl space-y-6">
        <Heading level="hero" className="break-words">
          {t("anywhere.heading")}
        </Heading>
        <p className="max-w-prose text-fg">{t("anywhere.intro")}</p>
        <nav aria-label={t("anywhere.jumpLabel")}>
          <ul className="flex flex-wrap gap-2">
            {offerings.map((offering) => (
              <li key={offering.id}>
                <a
                  href={`#${offering.id}`}
                  className="eyebrow inline-flex min-h-tap items-center border border-fg px-4 transition-colors duration-(--duration-micro) hover:bg-fg/10"
                >
                  {offering.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function OfferingSection({ offering, tinted }: { offering: Offering; tinted: boolean }) {
  const { openInquiry } = useInquiry();
  const reviews = getReviewsForOffering(offering.id);
  const titleId = `${offering.id}-title`;
  const audiences = forYouList.format(offering.audiences.map((audience) => t(`audience.${audience}`)));
  const trips = (offering.tripSlugs ?? []).flatMap((slug) => getTrip(slug) ?? []);
  const places = (offering.placeIds ?? []).flatMap((id) => getPlace(id) ?? []);

  return (
    <section
      id={offering.id}
      aria-labelledby={titleId}
      className={`scroll-mt-header px-gutter py-12 sm:px-gutter-lg md:py-20 ${tinted ? "bg-bg-raised" : ""}`}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <LabelledMediaCarousel
          label={t("anywhere.photos", { title: offering.title })}
          items={offering.media}
          slideClassName="basis-[88%] sm:basis-[60%] lg:basis-[48%]"
        />

        <div className="space-y-4">
          <Heading level="h1" as="h2" id={titleId} className="break-words">
            {offering.title}
          </Heading>
          <p className="text-h3 font-display uppercase text-accent">{offering.tagline}</p>
          <p className="eyebrow text-fg-muted">{t("anywhere.forYou", { audiences })}</p>
        </div>

        {/* Story and examples side by side from lg, keeping lines short. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-prose space-y-4">
          {offering.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {offering.examples && offering.examples.length > 0 && (
          <div>
            <h3 className="eyebrow mb-3 text-fg-muted">{t("anywhere.examples")}</h3>
            <ul className="max-w-prose list-disc space-y-1.5 pl-5 marker:text-accent">
              {offering.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>
        )}
        </div>

        {(trips.length > 0 || places.length > 0) && (
          <div>
            <h3 className="eyebrow mb-1 text-fg-muted">{t("anywhere.seeItInAction")}</h3>
            <ul className="flex flex-wrap gap-x-5">
              {trips.map((trip) => (
                <li key={trip.slug}>
                  <Link to={`/trips/${trip.slug}`} className={`inline-flex min-h-tap items-center ${inlineLinkClasses}`}>
                    {trip.title}
                  </Link>
                </li>
              ))}
              {places.map((place) => (
                <li key={place.id}>
                  <Link to={`/places/${place.id}`} className={`inline-flex min-h-tap items-center ${inlineLinkClasses}`}>
                    {place.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <h3 className="eyebrow mb-3 text-fg-muted">{t("anywhere.reviews")}</h3>
            <ul className="grid gap-10 md:grid-cols-2 md:gap-12">
              {reviews.map((review) => (
                <li key={review.id}>
                  <ReviewQuote review={review} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button className="w-full md:w-auto" onClick={() => openInquiry({ offeringId: offering.id })}>
          {t("anywhere.ask")}
        </Button>
      </div>
    </section>
  );
}

function ReviewQuote({ review }: { review: Review }) {
  const byline = [review.author, review.country].filter(Boolean).join(", ");
  return (
    <figure className="h-full">
      <blockquote className="space-y-2">
        {review.title && <p className="font-medium">{review.title}</p>}
        <p className="text-small">{review.text}</p>
      </blockquote>
      <figcaption className="eyebrow mt-3 text-fg-muted">
        {byline}
        {" · "}
        {review.source.url ? (
          <a href={review.source.url} target="_blank" rel="noopener noreferrer" className="transition-colors duration-(--duration-micro) hover:text-accent">
            {review.source.name}
          </a>
        ) : (
          review.source.name
        )}
      </figcaption>
    </figure>
  );
}
