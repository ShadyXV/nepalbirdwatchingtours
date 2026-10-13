import type { Memory } from "../types";
import { memories as catalog } from "./catalog/memories";
import { withMockPhotos } from "./media/withMockPhotos";

export const memories: Memory[] = withMockPhotos(catalog);
