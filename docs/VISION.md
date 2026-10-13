# Vision: what this site should feel like

The owner's intent for Nepal Birdwatching Tours, gathered from our early conversations (October 2026).
This is the north star for vibe, aesthetics and interaction. When a detail elsewhere conflicts with this,
this wins. Specs that implement it: `EXPERIENCE.md` (interaction), `STYLE_GUIDE.md` (look),
`PLAN.md` (stack and phases).

## Who it's for, and the promise

A site for **Krishna Thapa**: certified guide, passionate birder and naturalist, artist and photographer.
He leads birding trips and day tours (Kathmandu's hills, Chitwan, Bardia), and joins treks as the birding
expert alongside the trek guide. He knows the mountains: Annapurna, Langtang, Mardi Himal, the east, and
more.

**The promise:** he isn't an ordinary trip runner. If you're into birds, he can make your trip, in any
season, anywhere in Nepal. The site doesn't claim this; it shows it, through what he has seen, where and
with whom.

## The feeling

- **Personal, not a brochure.** It should feel like sitting with Krishna as he flips through his trips:
  memories with past guests, the birds and animals they saw together, photos from those days. Location,
  altitude and stays are there, but quietly, as supporting detail.
- **Warm, friendly, professional, and visibly excited about birds and nature.** Plain, straightforward
  words. Enthusiasm for every bird, never framed by how rare or "important" it is.
- **A serious birder's eye, lightly worn.** Every bird, animal, butterfly, flower and mountain has a name,
  its scientific name, a place and a moment, like a field notebook. Never a database: no coordinates, no
  conservation codes, no data dumps.
- **An artist's site.** Rudimentary in scope, but artistic and carefully built. Few things, each made well.
- **Lean and light.** A static site, fast on a phone, no tracking, no analytics, no CRM feel.

## Aesthetics

- **The map is a beautiful object.** Nepal as stylized terrain, like a map printed on paper but popping
  slightly into 3D. Natural colours of the land. Almost no labels: a few main cities and, above all,
  **mountain names**.
- **Mountains get special love.** Big peaks and ranges are always present, explorable, and shown at their
  most beautiful, even when no trip climbs them.
- **Inspired by San Rita (sanrita.ca), never copied:** terrain you dive into, hand-drawn-feeling routes and
  markers, dark content sheets rising over the map, giant condensed headlines overlapping it, tilted photo
  stacks springing in, a monospaced "field notes" voice. Fonts: tall condensed display with a mono text face.
  Colours drawn from Nepal: monal copper and teal, rhododendron, forest, snow.
- **Lots of moving imagery.** Wide landscape photos and short high-quality clips of birds, animals and
  landscapes. Even stills feel alive (slow pan and zoom, crossfades). Video and map can overlap and blend.
  Many images per section, in swipeable carousels.
- **Easy to retune.** The look will be iterated on, so colours, fonts and motion live as named constants.

## Interaction

- **The map is the centre of everything.** You arrive at all of Nepal, see the trips as photo pins with how
  many birds you might meet, and tap one to **zoom into it**: its route, villages and stays, birding spots,
  and what lives there.
- **Content rises from below.** Scroll and the story slides up over the map: headline, memories, photos,
  then the practical detail. Natural scrolling, never hijacked.
- **One interaction pattern, no pop-ups.** Trips are the main thing. Mountains, ranges, parks and one-off
  places work the same way (fly there, scroll to reveal), just lighter and lower in the hierarchy.
- **Seamless, animated, and still real pages.** Moving through the site from the home page feels like one
  continuous journey. Yet every trip and place is a real page, fully readable without JavaScript, by
  search engines and by AI agents.
- **Phones first.** Most guests will visit on a phone. Every gesture, sheet and button is designed for
  one thumb, then scaled up to desktop.
- **Reaching Krishna is always one tap away.** No contact page: an inquiry with dates and party size can
  open anywhere and goes straight to WhatsApp, email or Instagram. "Plan a trip here" works from any
  mountain or place.
- **Friendly to other people's AI agents.** An agent can read trips, places and availability in a
  structured way and prepare an inquiry for its human.

## Content hierarchy

1. **Trips:** multi-day birding treks, wildlife trips, single-day hikes. Each one is a collection of stops
   and of memories.
2. **Memories and reviews:** past guests, real names (as they agree), their photos, links to the original
   review sources (e.g. TripAdvisor).
3. **Places:** mountains, ranges, parks, side trips, points of interest.
4. **Krishna:** his story, certifications, art and photography.
5. **Practical facts:** altitude, nights, stays, seasons, prices (only when chosen to show).

## How we build it

Incrementally. The technical and interactive core first, with room left for real content (Krishna's
itineraries, photos, clips and reviews) to replace placeholders later. No unit tests; components and
screens kept cleanly separated so the site can grow.

## Still to decide (remind the owner)

- Home on phones: a swipeable trip-card row synced with the map, or pins only.
- About page: over a softly drifting, dimmed map, or a plain page.
- Terrain look once seen live: natural colours with paper grain and grid (recommended) vs. other blends.
- Optional delights: "seen it" ticks on checklists; "This month in Nepal"; a seasonal birding calendar.
- Screen recording of San Rita from the owner, to tune timing and feel.
