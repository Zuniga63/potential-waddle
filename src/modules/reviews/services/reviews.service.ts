import { Injectable } from '@nestjs/common';
import { ReviewsFindAllParams } from '../interfaces';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Review, ReviewStatusHistory } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminReviewsDto, ReviewStatusWasChangeDto, ReviewChangeStatusDto } from '../dto';
import { ReviewStatusEnum } from '../enums';
import { User, UserPoint } from 'src/modules/users/entities';
import { assignPlacePoints, fetchReviewApprovalData, updateReviewStatus } from '../logic/update-review-change';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,

    private readonly dataSource: DataSource,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  async findAll({ queries }: ReviewsFindAllParams) {
    const { page = 1, limit = 25 } = queries;
    const { status } = queries;

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Review> = {};

    if (status) where.status = status;

    const [reviews, count] = await this.reviewsRepository.findAndCount({
      skip,
      take: limit,
      relations: {
        user: true,
        place: true,
        lodging: { images: { imageResource: true } },
        images: { image: true },
      },
      select: {
        user: { username: true, id: true },
        place: { id: true, name: true },
        images: { id: true },
      },
      where,
    });

    return new AdminReviewsDto({ currentPage: page, pages: Math.ceil(count / limit), count }, reviews);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * APPROVE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async chnageStatus({
    id,
    user: adminUser,
    body,
  }: {
    id: string;
    user: User;
    body: ReviewChangeStatusDto;
  }): Promise<ReviewStatusWasChangeDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    const { reason, status: newStatus } = body;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reviewRepository = queryRunner.manager.getRepository(Review);
      const userRepository = queryRunner.manager.getRepository(User);
      const userPointRepository = queryRunner.manager.getRepository(UserPoint);
      const reviewStatusHistoryRepository = queryRunner.manager.getRepository(ReviewStatusHistory);

      // Get the review with relationsships and only the necessary fields
      const { review, user, town, place } = await fetchReviewApprovalData({ id, repository: reviewRepository });
      await updateReviewStatus({ review, adminUser, newStatus, repository: reviewRepository });

      // Create a new review status history record
      const newHistoryRecord = reviewStatusHistoryRepository.create({
        review: { id: review.id },
        reviewer: { id: adminUser.id },
        status: newStatus,
        reason: reason,
      });

      await reviewStatusHistoryRepository.save(newHistoryRecord);

      if (place && newStatus === ReviewStatusEnum.APPROVED) {
        await assignPlacePoints({
          user,
          place,
          town,
          review,
          userRepository,
          userPointRepository,
        });
      }

      await queryRunner.commitTransaction();

      return { ok: true, reviewId: review.id, status: review.status };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
