import type { Guide } from "../types";

// TODO: replace all placeholder copy and contact details with Krishna's real ones.
export const guide: Guide = {
  name: "Krishna Thapa",
  brand: "Nepal Birdwatching Tours",
  tagline: "Birding the Himalaya with a local who loves every feather.",
  bio: [
    "Krishna Thapa is a passionate nature guide with over 6 years of experience in birdwatching and wildlife guiding across Nepal. With extensive field knowledge of the country's key biodiversity areas, he has guided birders, wildlife enthusiasts, and photographers in search of Nepal's remarkable flora and fauna. His keen eye for wildlife and dedication to conservation make every excursion both educational and memorable.",
    "Beyond guiding, Krishna is a talented wildlife artist, renowned for his detailed paintings of birds, mammals, and natural landscapes. His artistic perspective is reflected not only in his illustrations but also in his wildlife photography and videography, where he captures the beauty of Nepal's biodiversity through a creative and storytelling approach.",
    "Combining his expertise as a guide, artist, and visual storyteller, Krishna offers guests a unique experience that deepens their appreciation of nature while inspiring a stronger connection to wildlife and conservation.",
    "Passionate about inspiring the next generation, Krishna actively teaches young artists, helping them develop their skills in drawing birds, wild animals, and natural landscapes. Through his workshops and mentorship, he encourages creativity while fostering a deeper appreciation for wildlife and conservation.",
  ],
  basedIn: "Kathmandu, Nepal",
  yearsGuiding: 6,
  certifications: [{ name: "Certified Nature Guide", issuer: "TODO" }],
  languages: ["English", "Nepali"],
  specialties: ["Birdwatching and wildlife guiding", "Wildlife art", "Photography and videography", "Teaching young artists"],
  portrait: {
    kind: "image",
    src: "/media/krishna-portrait.jpg",
    alt: "Krishna Thapa in camouflage field clothes with binoculars and a camera, arms crossed, in green forest",
    focal: [0.5, 1],
    width: 1060,
    height: 1590,
  },
  art: [],
  contact: {
    whatsapp: "9770000000000", // TODO
    email: "hello@example.com", // TODO
    instagram: "your-handle", // TODO
  },
};
