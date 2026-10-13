import type { Landmark } from "../types";
import { landmarks as catalog } from "./catalog/landmarks";
import { withMockPhotos } from "./media/withMockPhotos";

export const landmarks: Landmark[] = withMockPhotos(catalog);
