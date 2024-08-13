import { BadRequestException, Injectable, Logger, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from '../entities';
import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { Place } from 'src/modules/places/entities';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateReviewDto, UpdateReviewDto } from '../dto';

@Injectable()
export class PlaceReviewsService {
  private logger = new Logger(PlaceReviewsService.name);
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE NEW PLACE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async create({ placeId, user, reviewDto }: { placeId: string; user: User; reviewDto: CreateReviewDto }) {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
      select: { id: true, rating: true, reviewCount: true },
    });
    if (!place) throw new NotFoundException('Place not found');

    const userHasReview = await this.reviewRepository.exists({
      where: { user: { id: user.id }, place: { id: placeId } },
    });
    if (userHasReview) throw new BadRequestException('You have already reviewed this place');

    const review = this.reviewRepository.create({ ...reviewDto, place: { id: placeId }, user: { id: user.id } });
    await this.reviewRepository.save(review);

    place.rating = await this.getAverageRating(placeId);
    place.reviewCount += 1;
    this.placeRepository.save(place);

    review.place = place;
    return review;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL PLACE REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  /**
   * This method is not implemented yet.
   * @param id Place ID
   */
  async findAll(id: string) {
    this.logger.warn(`Intento de obtener todas las revisiones de un lugar con id: ${id}`);
    throw new NotImplementedException(`Method not implemented.`);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL USER REVIEWS OF PLACES
  // * ----------------------------------------------------------------------------------------------------------------
  /**
   * Get all reviews of a user for places.
   * @returns {Promise<Array>} Array of reviews
   */
  async getUserReviews({ userId }: { userId: string }): Promise<Array<any>> {
    const where: FindOptionsWhere<Review> = { user: { id: userId }, place: Not(IsNull()) };
    const select: FindOptionsSelect<Review> = { place: { id: true, name: true } };
    const relations: FindOptionsRelations<Review> = { images: true, place: true };

    return this.reviewRepository.find({ where, relations, select });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET USER REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  /**
   * Get a review of a user for a place. If the review does not exist, it throws a NotFoundException.
   * @param reviewId Review ID
   * @param userId User ID
   * @param placeId Place ID
   * @returns {Promise<Review>} Review
   */
  async findOne(reviewId: string, userId: string, placeId: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, user: { id: userId }, place: { id: placeId } },
      select: { place: { id: true } },
      relations: { images: true, place: true },
    });
    if (!review) throw new NotFoundException('Review not found');

    return review;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async update({
    reviewId,
    userId,
    placeId,
    reviewDto,
  }: {
    reviewId: string;
    userId: string;
    placeId: string;
    reviewDto: UpdateReviewDto;
  }) {
    const [review, place] = await Promise.all([
      this.reviewRepository.findOne({ where: { id: reviewId, user: { id: userId }, place: { id: placeId } } }),
      this.placeRepository.findOne({ where: { id: placeId }, select: { id: true, rating: true, reviewCount: true } }),
    ]);
    if (!review) throw new NotFoundException('Review not found');

    this.reviewRepository.merge(review, reviewDto);
    await this.reviewRepository.save(review);

    place.rating = await this.getAverageRating(placeId);
    this.placeRepository.save(place);

    review.place = place;
    return review;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async remove({ reviewId, userId, placeId }: { reviewId: string; userId: string; placeId: string }) {
    const [review, place] = await Promise.all([
      this.reviewRepository.findOne({ where: { id: reviewId, user: { id: userId }, place: { id: placeId } } }),
      this.placeRepository.findOne({ where: { id: placeId }, select: { id: true, rating: true, reviewCount: true } }),
    ]);
    if (!review) throw new NotFoundException('Review not found');

    await this.reviewRepository.remove(review);

    place.rating = await this.getAverageRating(placeId);
    place.reviewCount -= 1;
    this.placeRepository.save(place);

    review.place = place;
    return review;
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UTILS
  // * ----------------------------------------------------------------------------------------------------------------
  private async getAverageRating(placeId: string): Promise<number> {
    try {
      const { avg } = await this.reviewRepository
        .createQueryBuilder()
        .select('AVG(rating)', 'avg')
        .where('place_id = :id', { id: placeId })
        .getRawOne();

      if (!avg || isNaN(Number(avg))) return 0;

      return Number(avg);
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }
}
