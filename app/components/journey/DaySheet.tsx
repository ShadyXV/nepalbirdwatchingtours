import { useEffect, useRef } from "react";
import { formatAltitude, formatFieldDate } from "~/components/ui";
import { getMemoriesForWaypoint } from "~/content";
import type { Landmark, Trip } from "~/content/types";
import { t } from "~/i18n";
import { dayChecklist, type TripDay } from "~/lib/tripDays";

/**
 * "This day ↑": a sheet rising from below with the day's own text (trip-level facts stay in the
 * overview): every stop with its stay and Krishna's note, memories with guests there, the full
 * checklist by common name (★ seen with guests here; no scientific names in the day view), and the
 * mountains seen from here. Not a pop-up: a sheet,
 * as everywhere else. While it is open, the wheel and touch scroll it (day stepping is suspended);
 * ✕, Esc, or dragging the handle down closes it.
 */
type DaySheetProps = {
  trip: Trip;
  day: TripDay;
  open: boolean;
  peaks: Landmark[] | null;
  onClose: () => void;
};

/** Drag the handle down this far to close, px. */
const CLOSE_DRAG_PX = 80;

export function DaySheet({ trip, day, open, peaks, onClose }: DaySheetProps) {
  const ref = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const drag = useRef<{ y: number; id: number } | null>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus({ preventScroll: true });
  }, [open]);

  const stops = day.rest ? [day.anchor] : day.waypoints;
  const memories = stops.flatMap((w) => getMemoriesForWaypoint(trip.slug, w.id));
  const checklist = dayChecklist(trip, day);
  const title = t("journey.thisDayTitle", { day: day.n, place: day.rest ? t("journey.restDay", { place: day.anchor.name }) : day.anchor.name });

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    ref.current.style.setProperty("--jr-sheet-drag", `${dy}px`);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    ref.current.style.removeProperty("--jr-sheet-drag");
    if (dy > CLOSE_DRAG_PX) onClose();
  };

  return (
    <section
      ref={ref}
      className="jr-sheet"
      data-open={open ? "" : undefined}
      aria-label={title}
      aria-hidden={!open || undefined}
      inert={!open || undefined}
    >
      <div className="jr-sheet__handle" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <span aria-hidden="true" />
      </div>
      <header className="jr-sheet__head">
        <h2 ref={titleRef} tabIndex={-1} className="jr-sheet__title">
          {title}
        </h2>
        <button type="button" className="jr-icon" aria-label={t("journey.close")} onClick={onClose}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </header>

      <div className="jr-sheet__body" data-journey-scroll="">
        <section>
          <h3 className="eyebrow jr-sheet__label">{t("journey.stopsToday")}</h3>
          <ol className="jr-sheet__stops">
            {stops.map((w) => (
              <li key={w.id}>
                <p className="jr-sheet__stop">
                  <span className="jr-sheet__stop-name">{w.name}</span>
                  <span className="jr-chip__alt">{formatAltitude(w.altitudeM)}</span>
                </p>
                {w.stay && w.stay.kind !== "none" && (
                  <p className="eyebrow text-fg-muted">
                    {t("journey.stay")}: {w.stay.name ?? w.stay.kind}
                    {w.stay.note ? ` · ${w.stay.note}` : ""}
                  </p>
                )}
                {w.summary && <p className="mt-1">{w.summary}</p>}
              </li>
            ))}
          </ol>
        </section>

        {memories.length > 0 && (
          <section>
            <h3 className="eyebrow jr-sheet__label">{t("journey.withGuests")}</h3>
            {memories.map((m) => (
              <article key={m.id} className="jr-memory">
                <h4 className="jr-memory__title">{m.title}</h4>
                <p className="jr-memory__when">
                  <span className="accent">{formatFieldDate(m.date)}</span>
                  {m.guests && <span className="accent"> · {m.guests}</span>}
                </p>
                {m.story.map((paragraph, i) => (
                  <p key={i} className="mt-2">
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </section>
        )}

        {checklist.length > 0 && (
          <section>
            <h3 className="eyebrow jr-sheet__label">{t("journey.checklist")}</h3>
            <p className="eyebrow text-fg-muted">{t("journey.seenWithGuests")}</p>
            {checklist.map((group) => (
              <section key={group.group} className="mt-4">
                <h4 className="eyebrow text-fg-muted">{t(`group.${group.group}`)}</h4>
                <ul className="jr-checklist">
                  {group.items.map(({ species, sighting, seenWithGuests }) => (
                    <li key={species.id} className="jr-checklist__item">
                      <span className="jr-checklist__star" aria-hidden={!seenWithGuests || undefined}>
                        {seenWithGuests ? "★" : ""}
                      </span>
                      <span>{species.commonName}</span>
                      <span className="eyebrow text-fg-muted">{t(`likelihood.${sighting.likelihood}`)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        )}

        {peaks && peaks.length > 0 && (
          <section>
            <h3 className="eyebrow jr-sheet__label">{t("journey.seenFromHere")}</h3>
            <ul className="jr-seen__list">
              {peaks.map((p) => (
                <li key={p.id}>
                  <span className="jr-sheet__peak">{p.name}</span> <span className="jr-chip__alt">{formatAltitude(p.elevationM ?? 0)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}
