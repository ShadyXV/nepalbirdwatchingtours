import { t } from "~/i18n";

/**
 * The day view's controls. Top: "← Overview" (always visible), the trip, `4 / 12`, ✕. Bottom
 * (thumb reach on phones): display-only progress dots, ‹ prev / next ›, "This day ↑", Inquire.
 * The dots show the trail but are not jump targets: days go strictly in order.
 */

type TopProps = { title: string; day: number; total: number; onExit: () => void };

export function DayTop({ title, day, total, onExit }: TopProps) {
  const end = day > total;
  return (
    <div className="jr-top">
      {/* Text only: the ‹ chevron means "previous day" here, so "Overview" doesn't reuse it. */}
      <button type="button" className="jr-btn jr-btn--quiet" onClick={onExit}>
        {t("journey.overview")}
      </button>
      <p className="jr-top__title eyebrow">{title}</p>
      <p className="jr-top__count" aria-hidden="true">
        {end ? (
          <span className="eyebrow">{t("journey.wholeWay")}</span>
        ) : (
          <>
            <span className="jr-top__num">{day}</span>
            <span className="jr-top__of">/ {total}</span>
          </>
        )}
      </p>
      <button type="button" className="jr-icon jr-top__close" aria-label={t("journey.close")} aria-keyshortcuts="Escape" onClick={onExit}>
        <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" /></svg>
      </button>
    </div>
  );
}

type BarProps = {
  day: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onThisDay: (() => void) | null;
  onInquire: () => void;
};

export function DayBar({ day, total, onPrev, onNext, onThisDay, onInquire }: BarProps) {
  const end = day > total;
  return (
    <div className="jr-bar">
      <div className="jr-bar__progress">
        <ol className="jr-dots" aria-hidden="true">
          {Array.from({ length: total + 1 }, (_, i) => i + 1).map((n) => (
            <li key={n} className={`jr-dot ${n === day ? "is-current" : n < day ? "is-done" : ""} ${n > total ? "jr-dot--end" : ""}`} />
          ))}
        </ol>
        <p className="sr-only">{end ? t("journey.wholeWay") : t("journey.progress", { day, total })}</p>
      </div>

      <div className="jr-bar__step" role="group" aria-label={t("journey.progress", { day: Math.min(day, total), total })}>
        <button type="button" className="jr-btn jr-btn--step" onClick={onPrev} disabled={day <= 1} aria-keyshortcuts="ArrowUp ArrowLeft PageUp">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="jr-btn__icon"><path d="M10 3L5 8l5 5" /></svg>
          <span className="jr-btn__text">{t("journey.prev")}</span>
        </button>
        <button type="button" className="jr-btn jr-btn--step" onClick={onNext} disabled={end} aria-keyshortcuts="ArrowDown ArrowRight PageDown Space">
          <span className="jr-btn__text">{t("journey.next")}</span>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="jr-btn__icon"><path d="M6 3l5 5-5 5" /></svg>
        </button>
      </div>

      <div className="jr-bar__more">
        {onThisDay && (
          <button type="button" className="jr-btn" onClick={onThisDay}>
            {t("journey.thisDay")}
            <svg aria-hidden="true" viewBox="0 0 16 16" className="jr-btn__icon"><path d="M3 10l5-5 5 5" /></svg>
          </button>
        )}
        <button type="button" className="jr-btn jr-btn--primary" onClick={onInquire}>
          {t("nav.inquire")}
        </button>
      </div>
    </div>
  );
}
