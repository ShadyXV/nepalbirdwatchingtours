import { format, parseISO } from "date-fns";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { getPublishedTrips, guide } from "~/content";
import type { Inquiry } from "~/content/types";
import { t } from "~/i18n";
import { Button, ButtonLink } from "../ui/Button";
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

  const field = "w-full rounded-md border border-ink/30 bg-snow px-3 py-2 text-sm";
  const label = "mb-1 block text-sm font-medium";

  return (
    <div className="fixed inset-0 z-50" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col overflow-y-auto rounded-t-2xl bg-paper p-5 shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[28rem] sm:rounded-none"
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl">
            {t("inquiry.title")}
          </h2>
          <Button variant="ghost" onClick={onClose} className="px-3 py-1">
            {t("inquiry.close")}
          </Button>
        </div>
        <p className="mb-4 text-sm text-ink-soft">{t("inquiry.intro")}</p>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
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
            <p className="mb-1 text-xs text-ink-soft">{t("inquiry.datesHint")}</p>
            <div className="rounded-md border border-ink/30 bg-snow p-2">
              <DayPicker mode="range" selected={range} onSelect={setRange} disabled={{ before: new Date() }} />
            </div>
            {range && (
              <button type="button" className="mt-1 text-xs underline" onClick={() => setRange(undefined)}>
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
            <p className={label}>{t("inquiry.sendVia")}</p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={whatsappUrl(guide.contact, text)} target="_blank" rel="noopener noreferrer">
                {t("inquiry.whatsapp")}
              </ButtonLink>
              <ButtonLink
                href={mailtoUrl(guide.contact, t("inquiry.emailSubject"), text)}
                variant="ghost"
              >
                {t("inquiry.email")}
              </ButtonLink>
              <Button variant="ghost" onClick={sendInstagram}>
                {t("inquiry.instagram")}
              </Button>
            </div>
            <p role="status" className="mt-2 min-h-5 text-sm text-ink-soft">
              {copied === "ok" && t("inquiry.copied")}
              {copied === "failed" && t("inquiry.copyFailed")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
