import { SITE_URL } from "~/lib/site";
import type { Inquiry } from "~/content/types";

type Prefill = Partial<Inquiry>;

/** Reads `?inquire&trip=&place=&offering=&from=&to=&party=`; returns null when `inquire` is absent. */
export function parseInquiryLink(search: string): Prefill | null {
  const params = new URLSearchParams(search);
  if (!params.has("inquire")) return null;

  const prefill: Prefill = {};
  const trip = params.get("trip");
  const place = params.get("place");
  const offering = params.get("offering");
  const from = params.get("from");
  const to = params.get("to");
  const party = Number.parseInt(params.get("party") ?? "", 10);

  if (trip) prefill.tripSlug = trip;
  if (place) prefill.placeId = place;
  if (offering) prefill.offeringId = offering;
  if (from) prefill.from = from;
  if (to) prefill.to = to;
  if (party > 0) prefill.partySize = party;
  return prefill;
}

/** Inverse of `parseInquiryLink`, as an absolute URL. */
export function buildInquiryLink(prefill: Prefill = {}, origin: string = SITE_URL): string {
  const parts = ["inquire"];
  if (prefill.tripSlug) parts.push(`trip=${encodeURIComponent(prefill.tripSlug)}`);
  if (prefill.placeId) parts.push(`place=${encodeURIComponent(prefill.placeId)}`);
  if (prefill.offeringId) parts.push(`offering=${encodeURIComponent(prefill.offeringId)}`);
  if (prefill.from) parts.push(`from=${encodeURIComponent(prefill.from)}`);
  if (prefill.to) parts.push(`to=${encodeURIComponent(prefill.to)}`);
  if (prefill.partySize) parts.push(`party=${prefill.partySize}`);
  return `${origin.replace(/\/$/, "")}/?${parts.join("&")}`;
}
