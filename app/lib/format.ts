import { format } from "date-fns";
import type { Month } from "~/content/types";

export function monthName(month: Month): string {
  return format(new Date(2000, month - 1, 1), "MMM");
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/** "2026-03-14" -> "14 March 2026"; "2026-03" -> "March 2026". Anything else is returned as given. */
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(date);
  if (!match) return date;
  const value = new Date(Number(match[1]), Number(match[2]) - 1, match[3] ? Number(match[3]) : 1);
  return format(value, match[3] ? "d MMMM yyyy" : "MMMM yyyy");
}

/** "2026-03-14" -> "March 2026". */
export function formatMonthYear(date: string): string {
  return formatDate(date.slice(0, 7));
}
