import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { Button } from "~/components/ui/Button";
import { getPublishedTrips, getReviews, guide, speciesCountForTrip } from "~/content";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

const services = ["lead", "day", "trek"] as const;

export function HomeScreen() {
  const { openInquiry } = useInquiry();
  const trips = getPublishedTrips();
  const reviews = getReviews();

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-14 sm:px-6">
      <section id="trips" className="scroll-mt-20">
        <h2 className="text-3xl">{t("home.tripsHeading")}</h2>
        <p className="mt-2 text-ink-soft">{t("home.tripsIntro")}</p>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <li key={trip.slug} className="overflow-hidden rounded-xl bg-snow shadow-sm">
              <Link to={`/trips/${trip.slug}`} className="block">
                <img
                  src={assetUrl(trip.cover.src)}
                  alt={trip.cover.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl">{trip.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{trip.tagline}</p>
                  <p className="mt-3 text-sm font-semibold text-forest">
                    {t("home.birds", { count: speciesCountForTrip(trip, "bird") })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid items-center gap-8 sm:grid-cols-[14rem_1fr]">
        <img
          src={assetUrl(guide.portrait.src)}
          alt={guide.portrait.alt}
          loading="lazy"
          className="aspect-square w-full rounded-xl object-cover"
        />
        <div>
          <h2 className="text-3xl">{t("home.introHeading")}</h2>
          <p className="mt-3">{guide.bio[0]}</p>
          <Link to="/about" className="mt-3 inline-block font-semibold text-forest underline">
            {t("home.introLink")}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-3xl">{t("home.servicesHeading")}</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-3">
          {services.map((key) => (
            <li key={key}>
              <h3 className="text-xl">{t(`home.services.${key}.title`)}</h3>
              <p className="mt-1 text-ink-soft">{t(`home.services.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-3xl">{t("home.reviewsHeading")}</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <figure className="rounded-xl bg-paper-deep p-5">
                <blockquote>{review.text}</blockquote>
                <figcaption className="mt-3 text-sm text-ink-soft">
                  {review.author}
                  {review.country && `, ${review.country}`}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-forest p-8 text-snow">
        <h2 className="text-3xl">{t("home.ctaHeading")}</h2>
        <p className="mt-2 max-w-prose">{t("home.ctaBody")}</p>
        <Button variant="ghost" className="mt-5 border-snow/60 text-snow hover:bg-snow/10" onClick={() => openInquiry()}>
          {t("nav.inquire")}
        </Button>
      </section>
    </div>
  );
}
