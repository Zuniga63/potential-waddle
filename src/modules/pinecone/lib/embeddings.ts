import { GoogleReviewInterface } from 'src/modules/google-places/interfaces/google-review.interface';
import { Document } from 'langchain/document';

export function createReviewDocument(review: GoogleReviewInterface) {
  let content = `Tipo: review\n`;
  if (review.reviewId) {
    content += `Id: ${review.reviewId}\n`;
  }
  if (review.authorName) {
    content += `Author: ${review.authorName}\n`;
  }
  if (review.text) {
    content += `Text: ${review.text}\n`;
  }
  if (review.reviewDate) {
    content += `Date: ${review.reviewDate}\n`;
  }
  if (review.rating) {
    content += `Rating: ${review.rating}\n`;
  }
  if (review.reviewUrl) {
    content += `Url: ${review.reviewUrl}\n`;
  }

  return new Document({
    pageContent: content,
    metadata: {
      id: review.reviewId,
      entityId: review.entityId,
      entityType: review.entityType,
      rating: review.rating || 0,
      source: review.reviewUrl || 'no source',
    },
  });
}
