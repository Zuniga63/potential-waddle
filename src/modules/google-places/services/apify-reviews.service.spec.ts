import { mapApifyItem } from './apify-reviews.service';

describe('ApifyReviewsService', () => {
  describe('mapApifyItem', () => {
    it('maps Apify raw item fields to FetchedReview shape', () => {
      const raw = {
        reviewId: 'abc123',
        name: 'John Doe',
        stars: 5,
        text: 'Excellent place!',
        reviewUrl: 'https://maps.google.com/review/abc123',
        publishedAtDate: '2024-01-15T10:00:00.000Z',
      };

      const result = mapApifyItem(raw);

      expect(result.reviewId).toBe('abc123');
      expect(result.authorName).toBe('John Doe');
      expect(result.rating).toBe(5);
      expect(result.text).toBe('Excellent place!');
      expect(result.reviewUrl).toBe('https://maps.google.com/review/abc123');
      expect(result.reviewDate).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('buildApifyPayload', () => {
    it('includes reviewsStartDate when since is provided', async () => {
      const { buildApifyPayload } = await import('./apify-reviews.service');
      const since = new Date('2024-06-01T00:00:00.000Z');
      const payload = buildApifyPayload('https://maps.google.com/place/test', since);

      expect(payload.startUrls).toEqual([{ url: 'https://maps.google.com/place/test' }]);
      expect(payload.reviewsStartDate).toBe(since.toISOString());
      expect(payload.reviewsCount).toBe(100);
      expect(payload.language).toBe('es');
    });

    it('omits reviewsStartDate and uses count 1000 when since is null (full pull)', async () => {
      const { buildApifyPayload } = await import('./apify-reviews.service');
      const payload = buildApifyPayload('https://maps.google.com/place/test', null);

      expect(payload.startUrls).toEqual([{ url: 'https://maps.google.com/place/test' }]);
      expect(payload).not.toHaveProperty('reviewsStartDate');
      expect(payload.reviewsCount).toBe(1000);
      expect(payload.language).toBe('es');
    });
  });
});
