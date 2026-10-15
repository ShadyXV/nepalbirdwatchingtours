import type { Trip } from "../types";
import { withMockPhotos } from "./media/withMockPhotos";
import { trip as annapurna } from "./trips/annapurna-birding-trek";
import { trip as bardiya } from "./trips/bardiya-wildlife-safari";
import { trip as chitwan } from "./trips/chitwan-wildlife-safari";
import { trip as gosaikunda } from "./trips/gosaikunda-birding-trek";
import { trip as ilam } from "./trips/ilam-red-panda-trek";
import { trip as langtang } from "./trips/langtang-birding-trek";
import { trip as mardi } from "./trips/mardi-himal-birding-trek";
import { trip as phulchowki } from "./trips/phulchowki-birding-day";

// Order = display order: treks, then wildlife safaris, then the day tour.
export const trips: Trip[] = withMockPhotos([
  annapurna,
  mardi,
  langtang,
  gosaikunda,
  ilam,
  chitwan,
  bardiya,
  phulchowki,
]);
