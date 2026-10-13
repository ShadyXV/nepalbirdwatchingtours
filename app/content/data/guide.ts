import type { Guide } from "../types";

// TODO: replace all placeholder copy and contact details with Krishna's real ones.
export const guide: Guide = {
  name: "Krishna Thapa",
  brand: "Nepal Birdwatching Tours",
  tagline: "Birding the Himalaya with a local who loves every feather.",
  bio: [
    "Krishna grew up beneath the forests of the Kathmandu valley rim and has been watching birds for as long as he can remember. Today he guides birders from around the world through Nepal's mountains, forests and wetlands.",
    "He is also an artist and photographer, and loves sharing the small details most people walk past.",
  ],
  basedIn: "Kathmandu, Nepal",
  certifications: [{ name: "Certified Nature Guide", issuer: "TODO" }],
  languages: ["English", "Nepali"],
  specialties: ["Himalayan birds", "Photography walks", "Forest and wetland birding"],
  portrait: {
    kind: "image",
    src: "/media/placeholder.svg",
    alt: "Portrait of Krishna Thapa (placeholder)",
  },
  art: [],
  contact: {
    whatsapp: "9770000000000", // TODO
    email: "hello@example.com", // TODO
    instagram: "your-handle", // TODO
  },
};
