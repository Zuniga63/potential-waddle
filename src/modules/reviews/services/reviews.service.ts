import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewsFindAllParams } from '../interfaces';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Review } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminReviewsDto, ApproveReviewDto } from '../dto';
import { ReviewStatusEnum } from '../enums';
import { User, UserPoint } from 'src/modules/users/entities';

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
      },
      select: {
        user: { username: true, id: true },
        place: { id: true, name: true },
      },
      where,
    });

    return new AdminReviewsDto({ currentPage: page, pages: Math.ceil(count / limit), count }, reviews);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * APPROVE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async approve({ id, user: adminUser }: { id: string; user: User }): Promise<ApproveReviewDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reviewRepository = queryRunner.manager.getRepository(Review);
      const userRepository = queryRunner.manager.getRepository(User);
      const userPointRepository = queryRunner.manager.getRepository(UserPoint);

      // Get the review with relationsships and only the necessary fields
      const review = await reviewRepository.findOne({
        where: { id },
        relations: { place: { town: true }, user: true },
        select: {
          id: true,
          status: true,
          place: { id: true, name: true, points: true, town: { id: true, name: true }, urbarCenterDistance: true },
          user: { id: true },
        },
      });

      if (!review) throw new NotFoundException('Review not found');
      if (review.status === ReviewStatusEnum.APPROVED) throw new BadRequestException('Review already approved');
      if (!review.place) throw new BadRequestException('Only place reviews can be approved');
      if (!review.user) throw new BadRequestException('This review does not have a user');

      const userId = review.user.id;
      const place = review.place;
      const town = place.town;
      const points = place.points;
      const distanceTravelled = place.urbarCenterDistance;

      const existingUserPoint = await userPointRepository.exists({
        where: {
          user: { id: userId },
          town: { id: town.id },
          review: { id: review.id },
          place: { id: place.id },
        },
      });

      if (existingUserPoint) throw new BadRequestException('This review is pending but the user already has points');

      // Update user points and distance travelled using increment
      await userRepository.increment({ id: userId }, 'totalPoints', points);
      await userRepository.increment({ id: userId }, 'rankingPoints', points);
      await userRepository.increment({ id: userId }, 'remainingPoints', points);
      await userRepository.increment({ id: userId }, 'distanceTravelled', distanceTravelled);

      // Update review status and approvedBy
      review.status = ReviewStatusEnum.APPROVED;
      review.approvedAt = new Date();
      review.approvedBy = { id: adminUser.id } as User;

      await reviewRepository.save(review);

      // Create a new user point record
      const newUserPointRecord = userPointRepository.create({
        user: { id: userId },
        town: { id: town.id },
        review: { id: review.id },
        place: { id: place.id },
        pointsEarned: points,
        pointsReedemed: 0,
        distanceTravelled,
      });

      await userPointRepository.save(newUserPointRecord);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { ok: true, reviewId: review.id, status: review.status };

      // TODO
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
