/**
 * Content model for Nepal Birdwatching Tours.
 *
 * Single source of truth: pages, the map, and the machine-readable agent files
 * (llms.txt, JSON, JSON-LD) are all generated from data typed by these shapes.
 * Data lives in app/content/data/*. Keep this file free of runtime code.
 */

/** [longitude, latitude] — GeoJSON / MapLibre order. */
export type LngLat = [lng: number, lat: number];

/** ISO date, e.g. "2026-11-03". */
export type IsoDate = string;

/** 1 = January … 12 = December. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/* ------------------------------------------------------------------ media */

/**
 * Where a video is served from. The player picks the renderer by `host`, so a
 * clip can move between hosts by editing data only.
 */
export type VideoSource =
  | { host: "local"; src: string; type?: "video/mp4" | "video/webm" }
  | { host: "uploadthing"; src: string; type?: "video/mp4" | "video/webm" }
  | { host: "youtube"; id: string };

/**
 * Field-record caption for a photo or clip: what was observed, where and when.
 * Rendered as a light notebook-style label (common name, italic scientific name, place, altitude,
 * date) — the site's "serious birder" signature. No coordinates or conservation codes on labels.
 */
export type Observation = {
  /** Species in frame; the first is the subject. */
  speciesIds?: Species["id"][];
  /** Peak or park in frame. */
  landmarkId?: Landmark["id"];
  /** Human place name, e.g. "Tadapani, Annapurna". */
  place?: string;
  altitudeM?: number;
  /** "2025-04" or a full IsoDate. */
  date?: string;
  /** Short field note, e.g. "pair foraging in moss, 06:40". */
  note?: string;
};

export type ImageAsset = {
  kind: "image";
  observation?: Observation;
  /** Path under /media (local) or absolute URL. */
  src: string;
  alt: string;
  credit?: string;
  /** Focal point (0–1, 0–1) used to aim Ken Burns pans and crops. */
  focal?: [x: number, y: number];
  width?: number;
  height?: number;
};

export type VideoAsset = {
  kind: "video";
  observation?: Observation;
  /** First playable source wins; list local/uploadthing variants in preference order. */
  sources: VideoSource[];
  /** Still frame shown before play and as reduced-motion fallback. */
  poster: string;
  alt: string;
  credit?: string;
  durationSec?: number;
  /** Ambient clips autoplay muted and loop; others show controls. */
  ambient?: boolean;
};

export type MediaAsset = ImageAsset | VideoAsset;

/* ---------------------------------------------------------------- species */

export type SpeciesGroup = "bird" | "mammal" | "reptile" | "amphibian" | "butterfly" | "plant";

export type Species = {
  /** Stable slug, e.g. "himalayan-monal". */
  id: string;
  group: SpeciesGroup;
  commonName: string;
  scientificName: string;
  /** Nepali name, if commonly used. */
  localName?: string;
  /** eBird species code, for linking out. */
  ebirdCode?: string;
  image?: ImageAsset;
  /** One enthusiastic line from Krishna. */
  note?: string;
};

export type Likelihood = "common" | "likely" | "possible" | "rare";

/** A species that can be seen at a specific waypoint. */
export type Sighting = {
  speciesId: Species["id"];
  likelihood: Likelihood;
  /** Months when it is realistically seen here; omit for year-round. */
  months?: Month[];
  note?: string;
};

/* -------------------------------------------------------------- waypoints */

export type WaypointKind =
  | "town"
  | "village"
  | "camp"
  | "viewpoint"
  | "forest"
  | "wetland"
  | "river"
  | "pass"
  | "park-gate";

export type StayKind = "teahouse" | "lodge" | "homestay" | "camp" | "hotel" | "none";

export type Stay = {
  kind: StayKind;
  name?: string;
  note?: string;
};

/**
 * One stop on a trip — a village, stay, or birding spot.
 * Not every stop gets rich content: only **key** stops carry the photos, story text, memories and a
 * full checklist. Other stops are a quiet line in the itinerary (day · name · altitude · stay) and a
 * minor marker; their `summary`, `sightings` and `media` may be empty.
 */
export type Waypoint = {
  /** Unique within its trip, e.g. "lama-hotel". */
  id: string;
  /** Key stop: featured in the story, the auto-tour and the stop stepper. */
  key?: boolean;
  /**
   * Gateway stop (arrival or departure city, airport) outside the trip's field area. Shown in the
   * itinerary, but left out of the trip's map pin, camera framing and max altitude.
   */
  transit?: boolean;
  name: string;
  kind: WaypointKind;
  coords: LngLat;
  altitudeM: number;
  /** Day number (1-based) the trip reaches this point. */
  day: number;
  /** Nights spent here; 0 for a pass-through birding stop. */
  nights: number;
  stay?: Stay;
  /** e.g. ["oak–rhododendron forest", "river gorge"]. */
  habitat?: string[];
  summary: string;
  sightings: Sighting[];
  media: MediaAsset[];
  /**
   * Optional curated "seen from here" mountains (Landmark ids, most striking first). Overrides the
   * computed list (distance + line of sight, app/lib/tripDays.ts) in the trip's day view.
   */
  views?: Landmark["id"][];
};

/* ------------------------------------------------------------------ trips */

export type TripKind = "birding-trek" | "day-tour" | "wildlife-safari" | "trek-support";

/** Krishna leads birding trips; on some treks he joins as birding specialist alongside a trek guide. */
export type GuideRole = "lead-guide" | "birding-specialist";

export type Difficulty = "easy" | "moderate" | "challenging" | "strenuous";

export type Pricing = {
  /** Master switch — prices stay hidden everywhere unless true. */
  show: boolean;
  amount: number;
  currency: "USD" | "EUR" | "NPR";
  per: "person" | "group" | "day";
  note?: string;
};

export type Trip = {
  /** URL slug: /trips/<slug>/ */
  slug: string;
  title: string;
  /** Short line shown on the map card. */
  tagline: string;
  kind: TripKind;
  guideRole: GuideRole;
  /** e.g. "Langtang National Park". */
  region: string;
  /** The map region this trip is listed under: /regions/<slug>/ */
  regionSlug: Region["slug"];
  durationDays: number;
  difficulty: Difficulty;
  maxAltitudeM: number;
  bestMonths: Month[];
  summary: string;
  highlights: string[];
  /** Map card image. */
  cover: ImageAsset;
  /** Background scene for the trip view: Ken Burns images and/or ambient clips. */
  reel: MediaAsset[];
  /** Ordered by day. Species counts are derived from these sightings. */
  waypoints: Waypoint[];
  /** Optional detailed track; otherwise the map connects waypoints in order. */
  route?: LngLat[];
  /** Landmark ids (peaks, parks) visible or visited on this trip. */
  landmarkIds: Landmark["id"][];
  reviewIds: Review["id"][];
  includes?: string[];
  /** What the guest pays for separately (flights, gear, tips…). */
  excludes?: string[];
  pricing?: Pricing;
  status: "draft" | "published";
};

/* ---------------------------------------------------------------- regions */

/**
 * A birding region (a park, a valley, a corner of the country) that groups trips. The home map shows
 * one pin per region; a region opens at /regions/<slug>/ with its description and all its trips on the
 * map at once. A region without trips stays hidden (no pin, no page) until a trip is assigned to it.
 */
export type Region = {
  /** URL slug: /regions/<slug>/ */
  slug: string;
  name: string;
  /** One short line for the map pin and region cards. */
  tagline: string;
  /** Pin position on the overview map. */
  coords: LngLat;
  /** Paragraphs: what the region is like for birders. */
  body: string[];
  /** Map pin / card image. */
  cover: ImageAsset;
  /** Parks and peaks that belong to the region. */
  landmarkIds: Landmark["id"][];
};

/* -------------------------------------------------------------- landmarks */

/**
 * A place on the map outside any itinerary: mountains and ranges (special love), cities, parks,
 * and one-off points of interest / side trips. Same interaction as a trip (page at /places/<id>/,
 * camera flies there, sheet rises with media, blurb, sightings, nearby trips) but lower in the
 * content hierarchy than trips. Never a pop-up.
 */
export type Landmark = {
  id: string;
  name: string;
  kind: "peak" | "range" | "city" | "park" | "poi";
  /** Label/marker position; for a range, its visual centre. */
  coords: LngLat;
  elevationM?: number;
  /** e.g. "Annapurna Himal" for its peaks. */
  range?: string;
  /** 1 = always visible, 2 = only when zoomed in. */
  labelTier: 1 | 2;
  /** One or two warm sentences. */
  blurb?: string;
  /** Landscape photos and clips; first is the card cover. */
  media: MediaAsset[];
  /** A light "you might see around here" list (6–12 species), not a full checklist. */
  sightings?: Sighting[];
  /** Trips that pass by or view it; shown as "trips nearby". */
  nearbyTripSlugs?: Trip["slug"][];
};

/* ---------------------------------------------------------------- reviews */

export type Review = {
  id: string;
  /** Guest's real name, as published at the source. */
  author: string;
  country?: string;
  date: IsoDate;
  rating?: 1 | 2 | 3 | 4 | 5;
  title?: string;
  text: string;
  tripSlug?: Trip["slug"];
  /** Offerings this review speaks to (e.g. "trek-photography"). */
  offeringIds?: Offering["id"][];
  source: {
    name: "TripAdvisor" | "Google" | "Direct" | (string & {});
    url?: string;
  };
  /** Small photo of the reviewer, shown as a round thumbnail next to their name. */
  avatar?: ImageAsset;
  media: MediaAsset[];
};

/* ----------------------------------------------------------- trip reports */

/**
 * One piece of a trip report's story, rendered in order:
 *   text     one or more paragraphs in Krishna's voice
 *   image    a single photo, full width, with an optional caption
 *   gallery  two to four photos side by side, with an optional shared caption
 * A photo's `observation` becomes its field label (bird, place, altitude, date).
 */
export type TripReportBlock =
  | { kind: "text"; paragraphs: string[] }
  | { kind: "image"; image: ImageAsset; caption?: string }
  | { kind: "gallery"; images: ImageAsset[]; caption?: string };

/**
 * A blog-style report from one past departure of a trip: how it went, photos of the group, and the
 * checklist of what we saw. Page at /trip-reports/<slug>/; the newest ones are listed on home.
 */
export type TripReport = {
  /** URL slug: /trip-reports/<slug>/, e.g. "phulchowki-march-2026". */
  slug: string;
  title: string;
  /** The trip this departure was (must be a published trip). */
  tripSlug: Trip["slug"];
  /** Day the trip started. */
  date: IsoDate;
  /** Guests as they agreed to be named, e.g. "Anna & Tom, Netherlands". */
  guests?: string;
  /** One or two sentences: the card text and the page's meta description. */
  summary: string;
  /** Card image and the large photo at the top of the page. */
  cover: ImageAsset;
  /** The story, top to bottom. */
  body: TripReportBlock[];
  /** Photos of the group that went (shown as a strip). */
  groupPhotos: ImageAsset[];
  /** Species we actually saw (Species ids), for the checklist. Any order; the page groups them. */
  seen: Species["id"][];
  /** The guests' own review of this trip, if they left one. */
  reviewId?: Review["id"];
};

/* ------------------------------------------------------------------- home */

/**
 * One of the main ways to go birding with Krishna, shown as a large photo block on home. Its title and
 * text are UI strings (i18n `home.services.<id>`); this holds the photo and where its link goes.
 */
export type HomeWay = {
  id: "lead" | "day" | "trek";
  image: ImageAsset;
  /** Site path for the block's small link, e.g. "/trips" or "/anywhere#trekking-group-naturalist". */
  href: string;
};

/* --------------------------------------------------------------- memories */

/**
 * A moment from a past trip with guests — the personal heart of each itinerary.
 * Trip and stop views lead with these; altitude, stays and checklists are supporting detail.
 */
export type Memory = {
  id: string;
  tripSlug: Trip["slug"];
  /** Where it happened; omit for a trip-wide memory. */
  waypointId?: Waypoint["id"];
  /** "2025-04" (month) or a full IsoDate. */
  date: string;
  /** Guests as they agreed to be named, e.g. "Anna & Tom, Netherlands". */
  guests?: string;
  title: string;
  /** Krishna's telling, first person. Paragraphs. */
  story: string[];
  /** Species actually seen that day — powers "seen with guests here" on checklists. */
  seen: Species["id"][];
  media: MediaAsset[];
  /** The guests' own review of that trip, if they left one. */
  reviewId?: Review["id"];
};

/* -------------------------------------------------------------- offerings */

/** Who an offering is for; drives the "for you if you're…" line. */
export type Audience =
  | "birders"
  | "photographers"
  | "cinematographers"
  | "researchers"
  | "artists"
  | "trekking-groups"
  | "families"
  | "first-timers";

/**
 * A way to travel or work with Krishna beyond the set trips — shown on the "Anywhere" page.
 * e.g. custom day trips anywhere, field crew support, birding specialist for trekking groups,
 * wild nature-focused trek photography. Photo-led, with relevant reviews.
 */
export type Offering = {
  /** Also the section anchor: /anywhere/#<id> */
  id: string;
  title: string;
  /** One warm line under the title. */
  tagline: string;
  audiences: Audience[];
  /** Paragraphs, Krishna's voice. */
  body: string[];
  /** Concrete examples, e.g. "Dawn at Phulchowki for a wildlife film crew". */
  examples?: string[];
  media: MediaAsset[];
  reviewIds: Review["id"][];
  /** Trips or places that show this offering in action. */
  tripSlugs?: Trip["slug"][];
  placeIds?: Landmark["id"][];
  pricing?: Pricing;
};

/* ---------------------------------------------------------- birding guide */

/** A destination on the "Birding in Nepal" page, linked to its place pages and trips where they exist. */
export type BirdingDestination = {
  /** Also the anchor: /birding-in-nepal/#<id> */
  id: string;
  name: string;
  body: string;
  placeIds?: Landmark["id"][];
  tripSlugs?: Trip["slug"][];
};

/** A sample itinerary: text only, not a map trip. Guests ask about it through the inquiry drawer. */
export type SampleItinerary = {
  id: string;
  title: string;
  body: string;
};

/**
 * The general guide page "Birdwatching Tours in Nepal" (/birding-in-nepal/): the owner's copy, section
 * by section. Section headings are part of the copy, so they live here, not in i18n.
 */
export type BirdingGuide = {
  title: string;
  /** Paragraphs. */
  intro: string[];
  why: { heading: string; body: string[]; highlightsIntro: string; highlights: string[] };
  destinations: { heading: string; items: BirdingDestination[] };
  itineraries: { heading: string; items: SampleItinerary[]; custom: SampleItinerary };
  included: { heading: string; items: string[] };
  bestTime: { heading: string; body: string[] };
};

/* ------------------------------------------------------------------ guide */

export type ContactChannels = {
  /** International format digits only, e.g. "9779800000000". */
  whatsapp: string;
  email: string;
  /** Handle without "@". */
  instagram: string;
};

export type Guide = {
  name: string;
  /** Brand name of the site. */
  brand: string;
  tagline: string;
  /** Paragraphs. */
  bio: string[];
  basedIn: string;
  yearsGuiding?: number;
  certifications: { name: string; issuer: string; year?: number }[];
  languages: string[];
  specialties: string[];
  portrait: ImageAsset;
  /** Krishna's artwork and photography. */
  art: MediaAsset[];
  contact: ContactChannels;
};

/* ----------------------------------------------------------- availability */

export type AvailabilityStatus = "available" | "limited" | "booked";

export type AvailabilityRange = {
  start: IsoDate;
  /** Inclusive. */
  end: IsoDate;
  status: AvailabilityStatus;
  note?: string;
};

/** Dates not covered by a range are "on request". Synced from Krishna's schedule later. */
export type Availability = {
  updated: IsoDate;
  timezone: "Asia/Kathmandu";
  ranges: AvailabilityRange[];
};

/* --------------------------------------------------------------- inquiry */

export type InquiryChannel = "whatsapp" | "email" | "instagram";

/**
 * What the inquiry drawer collects. Also the deep-link contract:
 * any page accepts ?inquire&trip=<slug>&place=<landmarkId>&offering=<id>&from=<IsoDate>&to=<IsoDate>&party=<n>
 * to open the drawer prefilled (documented for agents in llms.txt).
 */
export type Inquiry = {
  tripSlug?: Trip["slug"];
  /** "Plan a trip here" from a place page. */
  placeId?: Landmark["id"];
  /** "Ask about this" from an offering on the Anywhere page. */
  offeringId?: Offering["id"];
  from?: IsoDate;
  to?: IsoDate;
  partySize?: number;
  name?: string;
  message?: string;
  channel: InquiryChannel;
};
