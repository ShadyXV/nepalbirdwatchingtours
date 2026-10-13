# Seed trips: research notes

Placeholder content for three trips, written so the map and pages look right. **Geography, altitudes and
species are meant to be real; photos, clips, prices, stays, guests, reviews and stories are placeholders**
for Krishna to replace. Data: `app/content/data/trips/*.ts` and `app/content/data/catalog/*.ts`.
Check it with `validateSeed()` in `catalog/validate.ts` (dev-only, no side effects on import).

## Itineraries

### 1. Annapurna Sanctuary Birding Trek (12 days, `annapurna-birding-trek`)

| Day | Waypoint | Altitude | Nights | Stay |
|---|---|---|---|---|
| 1 | Phewa Lake, Pokhara | 800 m | 0 | hotel (pass) |
| 1 | Birethanti | 1025 m | 0 | - |
| 1 | Tikhedhunga | 1540 m | 1 | teahouse |
| 2 | Ulleri | 2020 m | 0 | - |
| 2 | Ghorepani | 2860 m | 2 | teahouse |
| 3 | Poon Hill | 3210 m | 0 | - |
| 4 | Ghorepani Deurali Pass | 2960 m | 0 | - |
| 4 | Tadapani | 2630 m | 1 | teahouse |
| 5 | Kimrong Khola | 1780 m | 0 | - |
| 5 | Chhomrong | 2170 m | 1 | teahouse |
| 6 | Sinuwa | 2340 m | 0 | - |
| 6 | Dovan | 2600 m | 1 | teahouse |
| 7 | Deurali | 3230 m | 1 | teahouse |
| 8 | Machhapuchhre Base Camp | 3700 m | 0 | - |
| 8 | Annapurna Base Camp | 4130 m | 1 | lodge |
| 9 | Bamboo | 2335 m | 1 | teahouse |
| 10 | Jhinu Danda | 1780 m | 1 | teahouse |
| 11 | Landruk | 1565 m | 0 | - |
| 11 | Ghandruk | 1940 m | 1 | homestay |
| 12 | Kimche | 1640 m | 0 | - |
| 12 | Nayapul | 1070 m | 0 | none (pass) |

### 2. Chitwan Jungle Birding and Wildlife Safari (4 days, `chitwan-wildlife-safari`)

| Day | Waypoint | Altitude | Nights | Stay |
|---|---|---|---|---|
| 1 | Sauraha | 150 m | 3 | lodge |
| 1 | Elephant Breeding Centre, Khorsor | 150 m | 0 | - |
| 2 | Rapti River | 150 m | 0 | - |
| 2 | Baghmara Community Forest | 150 m | 0 | - |
| 3 | Kasara and the Core Grasslands | 150 m | 0 | - |
| 3 | Tharu Village, Sauraha | 150 m | 0 | - |
| 4 | Bis Hazari Tal | 190 m | 0 | none (pass) |

### 3. Phulchowki Birding Day Hike (1 day, `phulchowki-birding-day`)

| Day | Waypoint | Altitude | Nights | Stay |
|---|---|---|---|---|
| 1 | National Botanical Garden, Godavari | 1500 m | 0 | - |
| 1 | Lower Phulchowki Forest | 1750 m | 0 | - |
| 1 | Phulchowki Mai Temple | 2100 m | 0 | - |
| 1 | Upper Oak–Rhododendron Forest | 2500 m | 0 | - |
| 1 | Phulchowki Summit | 2782 m | 0 | - |

## Sources consulted

- Wikipedia coordinates API (`en.wikipedia.org/w/api.php`, prop=coordinates and list=geosearch): Ghorepani, Poon Hill, Ghandruk, Tikhedhunga, Sauraha, Annapurna, Annapurna South, Hiunchuli, Machapuchare, Annapurna Sanctuary, Shivapuri Nagarjun National Park.
- Wikidata search and entity API (`www.wikidata.org/w/api.php`, property P625): Chhomrong, Birethanti, Landruk, Jhinu Danda, Tadapani, Meghauli.
- OpenStreetMap Overpass API (`overpass-api.de`, `overpass.kumi.systems`): two attempts for trail geometry, both failed (server busy / unreachable), so **no OSM geometry was used**.
- Everything else (the 12-day Pokhara to Pokhara ABC itinerary with Poon Hill, the Chitwan 4-day structure, the Phulchowki road stops, species lists by altitude, months, peak elevations) is from general knowledge of the standard routes and the usual field references (Grimmett, Inskipp and Inskipp, *Birds of the Indian Subcontinent*; eBird hotspot knowledge). It was **not re-checked against live sources** in this pass.
- Requests used the generic User-Agent `nbt-content-script/1.0`; nothing personal was sent.

## Confidence

**Solid:** the route order and the village names for the Annapurna trek; village altitudes (rounded to commonly quoted figures); peak elevations and coordinates (rounded); which species belong to which habitat band; scientific names (current eBird/Clements-style taxonomy); the Chitwan activity mix (canoe, community-forest walk, Kasara jeep, Bis Hazari Tal, Tharu village, Elephant Breeding Centre).

**Approximate (verify before launch):**
- **Trail geometry** is hand-drawn from anchor points (villages) with gentle interpolation, not a survey track. Expect 0.5-2 km of drift. Annapurna: 55 points. Chitwan: 24. Phulchowki: 8.
- **Village coordinates** come from Wikipedia/Wikidata, which often place a village at its municipality centre. Chhomrong, Landruk, Tadapani, Tikhedhunga, Birethanti, Jhinu Danda are probably within 1 km; the unlisted ones (Ulleri, Sinuwa, Dovan, Deurali, Machhapuchhre Base Camp, Bamboo, Kimrong Khola, Kimche, Nayapul) were placed by trail logic and could be 1-2 km off.
- **Chitwan**: Kasara, Bis Hazari Tal, Baghmara Community Forest, Elephant Breeding Centre and the Tharu village are placed within a few km of their true positions, not exactly. Bis Hazari Tal is the least certain.
- **Phulchowki**: the summit, Mai temple and garden are close; the "lower forest" and "upper forest" points are stops on the road, positioned by interpolation.
- **Likelihoods and months** are honest guesses for a typical visit in the stated season, not eBird frequency data. Rarities (Satyr Tragopan, tiger, sloth bear, Ibisbill, Bengal Florican) are marked rare/possible.
- **eBird codes are omitted** everywhere (not confident enough to include).
- **Prices** are plausible stand-ins; `pricing.show` is false.
- The catalog is larger than a minimal seed (270 species); the extras are used by the Chitwan, Phulchowki and landmark lists.

## Shot list

Everything below is a **placeholder image today**; the alt text is the brief for the real photo or clip (landscape orientation, clips 15-20 s ambient/muted). Each carries a field-note caption (species, place, altitude, month, note) in the data; update the caption with the real sighting when the photo is swapped in.

### 1. Annapurna Sanctuary Birding Trek (12 days, `annapurna-birding-trek`)

- Cover PHOTO: Wide shot: first light on Annapurna South and Machhapuchhre from Poon Hill, rhododendron in the foreground
- Reel 1 CLIP 16s: Clip, 16 s: slow pan across Annapurna South, Hiunchuli and Machhapuchhre as the first light hits, from Poon Hill
- Reel 2 PHOTO: Wide shot: scarlet Rhododendron arboreum in full bloom among mossy oaks above Ghorepani, mist in the valley
- Reel 3 PHOTO: Close, landscape crop: male Himalayan Monal perched on a mossy ridge in early light, iridescent mantle catching the sun
- Reel 4 PHOTO: Wide shot: Annapurna I from the Sanctuary floor at Annapurna Base Camp, prayer flags and trekkers small in the frame
- Reel 5 CLIP 15s: Clip, 15 s: mist drifting through bamboo and rhododendron at Bamboo, Fire-tailed Sunbird working a flower in the foreground
- Reel 6 PHOTO: Landscape: trekkers and Krishna with binoculars on the stone steps above Chhomrong, terraced hillside and Machhapuchhre behind
- Phewa Lake, Pokhara PHOTO: Wide shot: dawn over Phewa Lake with painted boats at the shore and the Annapurna range above the far hills
- Birethanti PHOTO: Landscape: Brown Dipper on a boulder in the Modi Khola below the Birethanti suspension bridge
- Tikhedhunga PHOTO: Wide shot: evening light on the terraced fields and subtropical forest at Tikhedhunga, the Ulleri ridge above
- Ulleri PHOTO: Landscape: mixed feeding flock with Whiskered Yuhina in a mossy oak above Ulleri, lichens and early rhododendron blooms
- Ghorepani PHOTO: Wide shot: rhododendron forest in bloom around Ghorepani, mist between the trees, trekkers on the stone path
- Ghorepani PHOTO: Landscape: Krishna and guests at the Ghorepani sun terrace with binoculars, scanning the forest edge
- Poon Hill PHOTO: Wide shot: sunrise from Poon Hill, Dhaulagiri on the left, Annapurna South and Machhapuchhre catching alpenglow on the right
- Poon Hill PHOTO: Close: Machhapuchhre at first light, a thin tilted fin of snow, from the Poon Hill viewing tower
- Ghorepani Deurali Pass PHOTO: Landscape: Great Parrotbill peering from a bamboo clump at the Deurali pass, moss and drifting cloud behind
- Tadapani PHOTO: Wide shot: dawn at the Tadapani clearing, Kalij Pheasant walking the forest edge with rhododendron blooms behind
- Tadapani PHOTO: Landscape: view from Tadapani across the Modi valley to Machhapuchhre at sunset, with oak silhouettes
- Kimrong Khola PHOTO: Landscape: Spotted Forktail on a wet boulder in the Kimrong Khola, spray and forest behind
- Chhomrong PHOTO: Wide shot: the stone steps of Chhomrong climbing the hillside, Annapurna South and Machhapuchhre above
- Chhomrong PHOTO: Landscape: male Blue-fronted Redstart on a terrace wall at Chhomrong, bright against dark oak forest
- Sinuwa PHOTO: Landscape: bamboo-and-oak forest above Sinuwa in cloud, a mixed flock of fulvettas and yuhinas in the foreground
- Dovan PHOTO: Wide shot: the bamboo forest at Dovan with the Modi Khola rushing past and wet stones on the trail
- Deurali PHOTO: Wide shot: the cliffs and silver-fir forest above Deurali in the morning light, with Himalayan Tahr on a ledge
- Deurali PHOTO: Landscape: Himalayan Monal female feeding under rhododendron scrub near Deurali
- Machhapuchhre Base Camp PHOTO: Wide shot: the south face of Machhapuchhre rising above Machhapuchhre Base Camp, trekkers on the trail below
- Annapurna Base Camp PHOTO: Wide shot: sunrise at Annapurna Base Camp, Annapurna I glowing gold above the bowl, prayer flags in the foreground
- Annapurna Base Camp PHOTO: Landscape: Snow Pigeons wheeling in front of Annapurna South face over the Sanctuary
- Annapurna Base Camp CLIP 18s: Clip, 18 s: still shot of Annapurna I at dawn with Snow Pigeons crossing the frame
- Bamboo PHOTO: Landscape: Great Parrotbill gripping a bamboo stem at Bamboo, soft cloud-forest light
- Bamboo PHOTO: Wide shot: bamboo forest at Bamboo in rain, moss on every branch
- Jhinu Danda PHOTO: Landscape: Plumbeous Water Redstart at the Modi Khola below Jhinu Danda, white water behind
- Landruk PHOTO: Wide shot: terraced fields and slate roofs of Landruk, with mist rising from the Modi valley
- Ghandruk PHOTO: Wide shot: slate rooftops of Ghandruk at sunrise with Annapurna South and Machhapuchhre behind
- Ghandruk PHOTO: Landscape: Streaked Laughingthrush in a Ghandruk garden, fruit tree and stone wall
- Kimche PHOTO: Landscape: Grey Wagtail on a river stone near Kimche, with terraced slopes behind
- Nayapul PHOTO: Landscape: the Modi Khola at Nayapul on the last afternoon, trekkers loading jeeps on the road

Memories (stories behind the stops):
- **The pheasant that walked into breakfast** (2025-04, tadapani; guests: Placeholder Guest A and partner, Germany) - needs the guests' OK to name them
  - PHOTO: Wide shot: the Tadapani clearing at first light, two guests on the teahouse doorstep with tea and binoculars, rhododendron blooms along the path
  - PHOTO: Landscape: male Kalij Pheasant crossing the Tadapani clearing, low sun on its crest
  - PHOTO: Close, landscape crop: Fire-tailed Sunbird at a rhododendron flower, long scarlet tail showing
- **A wall of mountains and one very loud monal** (2025-04, poon-hill; guests: Placeholder Guests G and H, Canada) - needs the guests' OK to name them
  - PHOTO: Wide shot: crowds and headlamps on the Poon Hill viewpoint at blue hour, Dhaulagiri a pale wall behind
  - PHOTO: Landscape: alpenglow on Annapurna South and Machhapuchhre seen from Poon Hill, a Lammergeier crossing the sky
  - PHOTO: Close: Rufous-breasted Accentor hopping at the Poon Hill viewpoint wall, mountains blurred behind
- **Waiting for the parrotbill** (2025-11, bamboo; guests: Placeholder Guest B and a friend, Netherlands) - needs the guests' OK to name them
  - PHOTO: Landscape: Great Parrotbill gripping a bamboo stem, drizzle and moss behind
  - PHOTO: Wide shot: two guests standing in the drizzle behind the Bamboo teahouse, binoculars up toward the bamboo wall
- **Snow pigeons at the end of the world** (2025-11, annapurna-base-camp; guests: Placeholder Guests I and J, United States) - needs the guests' OK to name them
  - PHOTO: Wide shot: Annapurna I turning gold at dawn above the Sanctuary, a small flock of Snow Pigeons crossing the face
  - PHOTO: Landscape: Alpine Accentor on a rock at Annapurna Base Camp, frost on the stones, snow peaks behind
  - PHOTO: Close: Large-eared Pika on a boulder at the Sanctuary, mid-call
- **The last evening's list** (2025-04, trip-wide; guests: Placeholder Guests K and L, Australia) - needs the guests' OK to name them
  - PHOTO: Wide shot: guests and Krishna on the Ghandruk guesthouse terrace at sunset, a notebook and bird list on the table, Annapurna South in the distance
  - PHOTO: Close: a hand-written bird checklist with ticks, a mug of tea and binoculars on a wooden table

Review photos:
- Placeholder Guest A: Landscape: two guests with binoculars at the Tadapani clearing, rhododendron in bloom, Krishna pointing at the forest edge
- Placeholder Guest B: Landscape: a trekker silhouetted against Annapurna I at dawn, Snow Pigeons overhead
- Placeholder Guest B: Close: Brown Dipper on a rock in the Modi Khola near Jhinu Danda

### 2. Chitwan Jungle Birding and Wildlife Safari (4 days, `chitwan-wildlife-safari`)

- Cover PHOTO: Wide shot: Greater One-horned Rhinoceros grazing at the edge of tall grass in soft morning mist, Chitwan
- Reel 1 CLIP 16s: Clip, 16 s: dugout canoe gliding down the misty Rapti at dawn, a Great Egret lifting off the bank
- Reel 2 PHOTO: Wide shot: golden elephant-grass at sunrise at Kasara with a Spotted Deer herd walking through
- Reel 3 PHOTO: Landscape: Great Hornbill perched on a bare sal branch, morning light on its yellow casque
- Reel 4 PHOTO: Wide shot: Gharial basking on a sandbar on the Rapti with a Pied Kingfisher on a snag nearby
- Reel 5 CLIP 15s: Clip, 15 s: Greater One-horned Rhinoceros wading and feeding in a pond at Bis Hazari Tal, egrets on its back
- Reel 6 PHOTO: Landscape: sunset over the Rapti River at Sauraha, Black-necked Stork silhouette on the far bank
- Sauraha PHOTO: Landscape: the lodge garden at Sauraha at breakfast, binoculars and a bird list on the table, Rhesus Macaque on the wall
- Sauraha PHOTO: Close: Indian Roller on a garden wire, in the clear morning light
- Elephant Breeding Centre, Khorsor PHOTO: Wide shot: elephant and calf at the Elephant Breeding Centre in late-afternoon light, sal forest behind
- Rapti River CLIP 18s: Clip, 18 s: drifting past a Gharial on a sandbar from the canoe, mist rising off the Rapti
- Rapti River PHOTO: Wide shot: a dugout canoe on the misty Rapti at dawn, Krishna pointing out a kingfisher to two guests
- Rapti River PHOTO: Landscape: Mugger Crocodile basking on the river bank with Little Egrets stepping past
- Baghmara Community Forest PHOTO: Landscape: Krishna and guests on a quiet forest trail in Baghmara, sal trunks in dappled light
- Baghmara Community Forest PHOTO: Close, landscape crop: Oriental Pied Hornbill in a fruiting fig, black and white against green
- Kasara and the Core Grasslands PHOTO: Wide shot: open-top jeep on the Kasara grassland track at sunrise, tall kans grass glowing gold
- Kasara and the Core Grasslands PHOTO: Landscape: Greater One-horned Rhinoceros in the Kasara grassland, tall grass and sal trees behind
- Kasara and the Core Grasslands PHOTO: Close: male Bengal Florican mid-display above the Kasara grassland, wings spread
- Tharu Village, Sauraha PHOTO: Wide shot: Tharu village lane at dusk, a mud-and-thatch house, smoke from a cooking fire, Baya Weaver nests in the tree
- Bis Hazari Tal PHOTO: Wide shot: sunrise over Bis Hazari Tal, mist on the water, water lilies in the foreground
- Bis Hazari Tal PHOTO: Landscape: Bronze-winged Jacana walking across lily pads, reflected in still water

Memories (stories behind the stops):
- **Drifting past a rhinoceros** (2026-02, rapti-river; guests: Placeholder Guest C and son, United Kingdom) - needs the guests' OK to name them
  - PHOTO: Wide shot: dugout canoe on the Rapti in mist, a boy pointing toward a rhinoceros feeding on the far bank
  - PHOTO: Landscape: pair of Ruddy Shelducks on a sandbar in early light, mist behind
  - PHOTO: Close: Pied Kingfisher hovering over the river, wings blurred
- **Waiting for the florican** (2026-03, kasara; guests: Placeholder Guest D and friends, Australia) - needs the guests' OK to name them
  - PHOTO: Wide shot: jeep parked at the edge of the Kasara grassland at first light, guests with binoculars and a thermos
  - PHOTO: Landscape: male Bengal Florican mid-leap above the golden grass, wings spread
- **The sound of a hornbill** (2026-02, baghmara-community-forest; guests: Placeholder Guests M and N, Switzerland) - needs the guests' OK to name them
  - PHOTO: Landscape: Great Hornbill on a bare sal branch, yellow casque catching the sun
  - PHOTO: Wide shot: guests in single file on a sal-forest trail, all binoculars pointing upward

Review photos:
- Placeholder Guest C: Landscape: guests in a dugout canoe on the Rapti, a rhinoceros feeding on the far bank in mist
- Placeholder Guest D: Landscape: guests waiting quietly at the edge of the Kasara grassland at first light, with a jeep behind

### 3. Phulchowki Birding Day Hike (1 day, `phulchowki-birding-day`)

- Cover PHOTO: Wide shot: dawn light through oak and rhododendron forest on Phulchowki, mist in the valley below, red blooms in the foreground
- Reel 1 CLIP 16s: Clip, 16 s: mist drifting through the mossy oak forest of Phulchowki at dawn, birdsong in the soundtrack, a Rufous Sibia in the foreground
- Reel 2 PHOTO: Close, landscape crop: male Mrs. Gould's Sunbird feeding at a rhododendron flower, red back catching the light
- Reel 3 PHOTO: Wide shot: view from the Phulchowki summit over layered Kathmandu Valley hills to the Langtang Himal on a clear morning
- Reel 4 CLIP 15s: Clip, 15 s: Spotted Forktail bobbing along a rocky mountain stream below the Phulchowki Mai temple
- Reel 5 PHOTO: Landscape: Krishna with guests on the Phulchowki road at dawn, binoculars up, mixed flock in the oaks above
- National Botanical Garden, Godavari PHOTO: Wide shot: early light on the paths of the National Botanical Garden at Godavari, mist and large trees
- National Botanical Garden, Godavari PHOTO: Close: Red-billed Blue Magpie in a garden tree, long blue tail and red bill in full view
- Lower Phulchowki Forest PHOTO: Landscape: a mixed flock of Whiskered Yuhina and Rufous Sibia in an oak, moss on every branch
- Phulchowki Mai Temple PHOTO: Landscape: Spotted Forktail on a wet boulder in the stream below the Phulchowki Mai temple
- Phulchowki Mai Temple PHOTO: Wide shot: the small temple and prayer flags among moss-draped trees beside the stream
- Upper Oak–Rhododendron Forest PHOTO: Wide shot: tall rhododendron in full red bloom over a mossy trail on upper Phulchowki, mist in the trees
- Phulchowki Summit PHOTO: Wide shot: layered valley hills fading into haze from the Phulchowki summit, the Langtang Himal white on the horizon
- Phulchowki Summit PHOTO: Landscape: Himalayan Griffon gliding past the Phulchowki summit, layered hills behind

Memories (stories behind the stops):
- **Lunch with a forktail** (2026-03, phulchowki-mai; guests: Placeholder Guest E and partner, United States) - needs the guests' OK to name them
  - PHOTO: Landscape: Spotted Forktail walking on wet rocks in the stream below the temple steps
  - PHOTO: Close: Rufous-bellied Niltava in the shaded forest by the temple, orange breast glowing
- **A clear day in November** (2025-11, phulchowki-summit; guests: Placeholder Guest F and friends, Spain) - needs the guests' OK to name them
  - PHOTO: Wide shot: guests at the summit looking toward the Langtang range on a very clear November afternoon
  - PHOTO: Landscape: Himalayan Bluetail perched low on a bamboo stem by the summit path

Review photos:
- Placeholder Guest E: Landscape: guests at the stream below Phulchowki Mai temple with binoculars raised
- Placeholder Guest F: Wide shot: guests at the Phulchowki summit with the Langtang Himal on the horizon

### Places (landmarks): first/second shots

- Kathmandu (city): Wide shot: Kathmandu Valley at dawn from the rim, rooftops and temple spires under thin mist, the Himalaya beyond / Landscape: Egyptian Vultures and Black Kites circling above the Bagmati river at Pashupatinath at dusk
- Pokhara (city): Wide shot: Machhapuchhre reflected in Phewa Lake from Lakeside at dawn, painted boats in the foreground / Landscape: Himalayan Griffons circling over the Pokhara valley at midday, paragliders far below
- Chitwan National Park (park): Wide shot: Greater One-horned Rhinoceros in tall grass at sunrise, Chitwan, mist on the river behind / Landscape: Great Hornbill on a bare sal branch in morning light, Chitwan / Landscape: dugout canoe drifting past a Gharial on a sandbar on the Rapti River at dawn
- Bardia National Park (park): Wide shot: open sal forest and grassland in Bardia National Park at golden hour, a herd of Spotted Deer in the open / Landscape: Asian Elephant crossing a river in Bardia, forest behind
- Annapurna Conservation Area (park): Wide shot: rhododendron forest in bloom on the Ghorepani trail, a trekker small on the path, mountains in the mist / Close: Himalayan Monal male in early light on a mossy ridge, Annapurna region
- Shivapuri Nagarjun National Park (park): Wide shot: oak–rhododendron forest on the Shivapuri ridge in mist, a Buddhist prayer-flag line across the trail / Landscape: Kalij Pheasant at the edge of the Shivapuri forest trail
- Langtang National Park (park): Wide shot: the Langtang valley in morning light with Langtang Lirung above the yak pastures / Landscape: oak–rhododendron forest above Lama Hotel in mist, Langtang
- Annapurna Himal (range): Wide shot: the full Annapurna range from Annapurna South to Machhapuchhre at dawn from Poon Hill / Landscape: sunset on the Annapurna range from Sarangkot above Pokhara, thin cloud bands
- Langtang Himal (range): Wide shot: the Langtang Himal seen from the Phulchowki summit on a clear winter morning, valley haze below / Landscape: Langtang Lirung and the Langtang range in alpenglow from the Langtang valley
- Mahalangur Himal (Everest region) (range): Wide shot: Everest, Lhotse and Nuptse above the Khumbu valley at dawn, prayer flags in the foreground / Landscape: Himalayan Monal male on a rhododendron slope in the Khumbu, snow peak behind
- Dhaulagiri Himal (range): Wide shot: Dhaulagiri range at sunrise from Poon Hill, with rhododendron silhouettes in the foreground / Landscape: the Dhaulagiri range seen across the Kali Gandaki valley in the afternoon, layered ridges
- Mansiri Himal (Manaslu) (range): Wide shot: Manaslu and the Mansiri range at dawn from the Budhi Gandaki valley / Landscape: bamboo-and-rhododendron forest in the Manaslu foothills in cloud
- Kanchenjunga Himal (range): Wide shot: Kanchenjunga at sunrise from the Kanchenjunga region, five summits lit pink above a sea of cloud / Landscape: rhododendron forest in the Kanchenjunga foothills in spring bloom, mist and moss
- Mount Everest (peak): Wide shot: Everest and Nuptse rising above the Khumbu valley in the first light, plume of wind-blown snow / Landscape: Everest seen from the Kala Patthar viewpoint at sunset, trekkers small on the ridge
- Kanchenjunga (peak): Wide shot: Kanchenjunga's five summits above cloud at sunrise, taken from the Kanchenjunga trek / Landscape: Kanchenjunga from Pangpema base camp in evening light, glacier in the foreground
- Lhotse (peak): Wide shot: the south face of Lhotse seen from Chukhung in the evening light / Landscape: Lhotse and Nuptse above the Imja valley with clouds streaming from the ridge
- Makalu (peak): Wide shot: Makalu's pyramid at sunrise above the Barun valley, orange alpenglow / Landscape: rhododendron forest in the lower Barun valley below Makalu, mist in the trees
- Cho Oyu (peak): Wide shot: Cho Oyu rising above the Gokyo lakes at sunrise, turquoise water in the foreground / Landscape: Cho Oyu from the Gokyo Ri viewpoint, with the Ngozumpa glacier below
- Dhaulagiri I (peak): Wide shot: Dhaulagiri I glowing orange at sunrise from Poon Hill, rhododendron in the foreground / Landscape: Dhaulagiri I and Tukuche Peak above the clouds, seen from the Ghorepani trail
- Manaslu (peak): Wide shot: Manaslu at sunrise from Samagaon, golden light on the summit / Landscape: the Budhi Gandaki valley with Manaslu in the distance and a line of prayer flags
- Annapurna I (peak): Wide shot: Annapurna I's south face at dawn from Annapurna Base Camp, golden light, prayer flags in the foreground / Landscape: Annapurna I from Poon Hill with the mist below, the pale shape at the edge of the range
- Annapurna South (peak): Wide shot: Annapurna South catching the first light from Poon Hill, a mist-filled valley below / Landscape: Annapurna South above the stone steps of Chhomrong at midday
- Hiunchuli (peak): Wide shot: Hiunchuli in cloud at sunrise, above the Modi Khola gorge / Landscape: Hiunchuli seen from the Deurali slope in clear afternoon light
- Machhapuchhre (peak): Wide shot: Machhapuchhre at dawn from Tadapani, its twin summit tilted above forested ridges / Landscape: Machhapuchhre reflected in Phewa Lake from Lakeside at sunrise
- Langtang Lirung (peak): Wide shot: Langtang Lirung at sunrise from Kyanjin Gompa, yak pastures in the foreground / Landscape: Langtang Lirung above the oak-and-rhododendron forest, from the trail near Lama Hotel
- Phulchowki (peak): Wide shot: rhododendron in bloom on the upper slopes of Phulchowki, mist in the trees / Close: Mrs. Gould's Sunbird feeding at a rhododendron flower on Phulchowki
- Koshi Tappu Wildlife Reserve (poi): Wide shot: the Koshi River at dawn with mist on the water, sandbars, and a flock of waterbirds in flight / Landscape: Ruddy Shelducks and Northern Pintails on a Koshi sandbar in winter light
- Phewa Lake (poi): Wide shot: Phewa Lake at dawn with Machhapuchhre reflected and a painted boat at the shore / Landscape: Pied Kingfisher hovering over Phewa Lake with painted boats behind
- Begnas Lake (poi): Wide shot: Begnas Lake in morning mist with a fisherman's boat and forested hills behind / Landscape: Little Grebe and Cotton Pygmy-Goose in the shallows of Begnas Lake
- Rara Lake (poi): Wide shot: Rara Lake at dawn, glassy blue water, pine forest and snow peaks beyond / Landscape: forest of Himalayan spruce and rhododendron on the Rara Lake shore, a Himalayan Monal in the foreground
- Karnali River, Bardia (poi): Wide shot: the Karnali River at Bardia in morning mist, sandbars and a sal-forested bank / Landscape: Gharial basking on a Karnali sandbar, forest behind
- Gosaikunda (poi): Wide shot: Gosaikunda lake in morning light with the Langtang Himal behind and prayer flags on the shore / Landscape: Yellow-billed Choughs over the rocky shore of Gosaikunda, the lake dark and still
- Sarangkot (poi): Wide shot: sunrise on the Annapurna range and Machhapuchhre from Sarangkot, mist in the Pokhara valley / Landscape: Himalayan Griffon gliding past paragliders over the Pokhara valley, from Sarangkot

