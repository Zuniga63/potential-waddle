import type { User } from 'src/modules/users/entities';
import type { Review } from '../../entities';
import { ReviewStatusEnum } from '../../enums';
import { Repository } from 'typeorm';

interface Params {
  review: Review;
  adminUser: User;
  newStatus: ReviewStatusEnum;
  repository: Repository<Review>;
}

export async function updateReviewStatus({ review, adminUser, newStatus, repository }: Params) {
  review.status = newStatus;

  if (newStatus === ReviewStatusEnum.APPROVED) {
    review.approvedAt = new Date();
    review.approvedBy = { id: adminUser.id } as User;
  }

  await repository.save(review);
}
