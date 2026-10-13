import type { Trip } from "../types";
import { withMockPhotos } from "./media/withMockPhotos";
import { trip as annapurna } from "./trips/annapurna-birding-trek";
import { trip as chitwan } from "./trips/chitwan-wildlife-safari";
import { trip as phulchowki } from "./trips/phulchowki-birding-day";

// Seed trips (researched placeholders). Order = display order.
export const trips: Trip[] = withMockPhotos([annapurna, chitwan, phulchowki]);
