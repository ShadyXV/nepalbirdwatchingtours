import { format, parseISO } from "date-fns";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { getOffering, getPlace, getPublishedTrips, guide } from "~/content";
import type { Inquiry } from "~/content/types";
import { t } from "~/i18n";
import { Button, ButtonLink } from "../ui/Button";
import { Heading } from "../ui/Heading";
import { instagramUrl, mailtoUrl, whatsappUrl } from "./channels";
import { composeMessage } from "./composeMessage";
import { useInquiry } from "./InquiryProvider";

const toIso = (date: Date) => format(date, "yyyy-MM-dd");
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function InquiryDrawer() {
  const { isOpen, prefill, openCount, close } = useInquiry();
  if (!isOpen) return null;
  return <DrawerPanel key={openCount} prefill={prefill} onClose={close} />;
}

function DrawerPanel({ prefill, onClose }: { prefill: Partial<Inquiry>; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [tripSlug, setTripSlug] = useState(prefill.tripSlug ?? "");
  // What the inquiry is about besides the trip: a place ("Plan a trip here") or an Anywhere offering.
  const [placeId, setPlaceId] = useState(prefill.placeId);
  const [offeringId, setOfferingId] = useState(prefill.offeringId);
  const [range, setRange] = useState<DateRange | undefined>(
    prefill.from
      ? { from: parseISO(prefill.from), to: prefill.to ? parseISO(prefill.to) : undefined }
      : undefined,
  );
  const [party, setParty] = useState(String(prefill.partySize ?? 2));
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);

  // Move focus in, return it on close, and stop the page behind from scrolling.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, []);

  const inquiry: Partial<Inquiry> = {
    tripSlug: tripSlug || undefined,
    placeId,
    offeringId,
    from: range?.from && toIso(range.from),
    to: range?.to && toIso(range.to),
    partySize: Number.parseInt(party, 10) || undefined,
    name,
    message,
  };
  const text = composeMessage(inquiry);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  async function sendInstagram() {
    window.open(instagramUrl(guide.contact), "_blank", "noopener");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("failed");
    }
  }

  // text-body is >= 16px, which stops iOS Safari zooming focused inputs.
  const field =
    "min-h-tap w-full rounded-field border border-border bg-bg px-3 py-2 text-body text-fg placeholder:text-fg-muted focus-visible:border-route";
  const label = "eyebrow mb-1.5 block text-fg-muted";
  const place = placeId ? getPlace(placeId) : undefined;
  const offering = offeringId ? getOffering(offeringId) : undefined;
  const topic = place
    ? t("inquiry.topicPlace", { name: place.name })
    : offering
      ? offering.title
      : undefined;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="sheet absolute inset-x-0 bottom-0 top-3 flex flex-col overflow-y-auto overscroll-contain rounded-t-sheet bg-bg-raised px-gutter pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-sheet md:inset-y-0 md:left-auto md:right-0 md:w-[28rem] md:rounded-none md:px-gutter-lg"
      >
        {/* Drag handle: visual affordance only. */}
        <div aria-hidden="true" className="flex justify-center pb-1 pt-2.5 md:hidden">
          <span className="h-1 w-10 rounded-full bg-fg-muted/60" />
        </div>
        <div className="mb-2 flex items-center justify-between gap-4 pt-2">
          <Heading level="h2" id={titleId}>
            {t("inquiry.title")}
          </Heading>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("inquiry.close")}
          </Button>
        </div>
        <p className="mb-5 text-small text-fg-muted">{t("inquiry.intro")}</p>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {topic && (
            <div className="flex items-center justify-between gap-3 rounded-field border border-route px-3 py-2">
              <p className="not-italic min-w-0">
                <span className="eyebrow block text-fg-muted">{t("inquiry.topic")}</span>
                <span className="font-medium">{topic}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`${t("inquiry.clearTopic")}: ${topic}`}
                onClick={() => {
                  setPlaceId(undefined);
                  setOfferingId(undefined);
                }}
              >
                {t("inquiry.clearTopic")}
              </Button>
            </div>
          )}

          <div>
            <label htmlFor="inq-trip" className={label}>
              {t("inquiry.trip")}
            </label>
            <select id="inq-trip" className={field} value={tripSlug} onChange={(e) => setTripSlug(e.target.value)}>
              <option value="">{t("inquiry.tripNone")}</option>
              {getPublishedTrips().map((trip) => (
                <option key={trip.slug} value={trip.slug}>
                  {trip.title}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className={label}>{t("inquiry.dates")}</legend>
            <p className="mb-2 not-italic text-small text-fg-muted">{t("inquiry.datesHint")}</p>
            <div className="flex justify-center rounded-field border border-border bg-bg p-2">
              <DayPicker mode="range" selected={range} onSelect={setRange} disabled={{ before: new Date() }} />
            </div>
            {range && (
              <button type="button" className="eyebrow mt-1 inline-flex min-h-tap items-center text-accent underline" onClick={() => setRange(undefined)}>
                {t("inquiry.clearDates")}
              </button>
            )}
          </fieldset>

          <div>
            <label htmlFor="inq-party" className={label}>
              {t("inquiry.party")}
            </label>
            <input
              id="inq-party"
              type="number"
              min={1}
              max={30}
              className={field}
              value={party}
              onChange={(e) => setParty(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="inq-name" className={label}>
              {t("inquiry.name")}
            </label>
            <input
              id="inq-name"
              type="text"
              autoComplete="name"
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="inq-message" className={label}>
              {t("inquiry.message")}
            </label>
            <textarea
              id="inq-message"
              rows={4}
              className={field}
              placeholder={t("inquiry.messagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <p className={`not-italic ${label}`}>{t("inquiry.sendVia")}</p>
            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
              <ButtonLink className="w-full md:w-auto" href={whatsappUrl(guide.contact, text)} target="_blank" rel="noopener noreferrer">
                {t("inquiry.whatsapp")}
              </ButtonLink>
              <ButtonLink
                className="w-full md:w-auto"
                href={mailtoUrl(guide.contact, t("inquiry.emailSubject"), text)}
                variant="ghost"
              >
                {t("inquiry.email")}
              </ButtonLink>
              <Button variant="ghost" className="w-full md:w-auto" onClick={sendInstagram}>
                {t("inquiry.instagram")}
              </Button>
            </div>
            <p role="status" className="mt-2 min-h-5 not-italic text-small text-fg-muted">
              {copied === "ok" && t("inquiry.copied")}
              {copied === "failed" && t("inquiry.copyFailed")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
