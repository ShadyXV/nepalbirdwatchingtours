import type { ContactChannels } from "~/content/types";

export function whatsappUrl(contact: ContactChannels, text?: string): string {
  const digits = contact.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mailtoUrl(contact: ContactChannels, subject?: string, body?: string): string {
  const params = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ].filter(Boolean);
  return `mailto:${contact.email}${params.length ? `?${params.join("&")}` : ""}`;
}

export function instagramUrl(contact: ContactChannels): string {
  return `https://instagram.com/${contact.instagram}`;
}
