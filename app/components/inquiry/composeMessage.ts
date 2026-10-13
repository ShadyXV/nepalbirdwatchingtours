import { format, parseISO } from "date-fns";
import { getTrip } from "~/content";
import type { Inquiry } from "~/content/types";

const day = (iso: string) => format(parseISO(iso), "d MMM yyyy");

/** Plain-text inquiry shared by all three channels. */
export function composeMessage(inquiry: Partial<Inquiry>): string {
  const trip = inquiry.tripSlug ? getTrip(inquiry.tripSlug) : undefined;
  const lines = ["Hello Krishna, I would like to ask about a birdwatching trip.", ""];

  lines.push(`Trip: ${trip ? trip.title : "Not sure yet / custom"}`);
  if (inquiry.from) lines.push(`Dates: ${day(inquiry.from)}${inquiry.to ? ` to ${day(inquiry.to)}` : ""}`);
  if (inquiry.partySize) lines.push(`Party size: ${inquiry.partySize}`);
  if (inquiry.message?.trim()) lines.push("", inquiry.message.trim());
  if (inquiry.name?.trim()) lines.push("", `Thanks, ${inquiry.name.trim()}`);

  return lines.join("\n");
}
