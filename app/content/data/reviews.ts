import type { Review } from "../types";
import { reviews as catalog } from "./catalog/reviews";
import { withMockPhotos } from "./media/withMockPhotos";

// TODO: replace with real reviews (TripAdvisor import).
export const reviews: Review[] = withMockPhotos(catalog);
