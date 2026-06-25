export interface FetchedReview {
  reviewId: string;
  authorName: string;
  rating: number;
  text: string;
  reviewUrl: string;
  reviewDate: Date | string;
}

export interface GoogleReviewsSourceService {
  fetchReviews(placeUrl: string, since?: Date | null): Promise<FetchedReview[]>;
}

export const GOOGLE_REVIEWS_SOURCE = 'GOOGLE_REVIEWS_SOURCE';
