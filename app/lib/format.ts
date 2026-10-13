import { format } from "date-fns";
import type { Month } from "~/content/types";

export function monthName(month: Month): string {
  return format(new Date(2000, month - 1, 1), "MMM");
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
