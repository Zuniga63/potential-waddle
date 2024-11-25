import { BadRequestException, Injectable, Logger, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review, ReviewImage } from '../entities';
import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { Place } from 'src/modules/places/entities';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateReviewDto, UpdateReviewDto } from '../dto';
import { TinifyService } from 'src/modules/tinify/tinify.service';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { ImageResource } from 'src/modules/core/entities';
import { ReviewStatusEnum } from '../enums';

@Injectable()
export class PlaceReviewsService {
  private logger = new Logger(PlaceReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,

    @InjectRepository(ImageResource)
    private readonly imageResourceRepository: Repository<ImageResource>,

    @InjectRepository(ReviewImage)
    private readonly reviewImageRepository: Repository<ReviewImage>,

    private readonly tinifyService: TinifyService,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE NEW PLACE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async create({ placeId, user, reviewDto }: { placeId: string; user: User; reviewDto: CreateReviewDto }) {
    const { images, ...reviewData } = reviewDto;

    const [place, userHasReview] = await Promise.all([
      this.placeRepository.findOne({
        where: { id: placeId },
        select: { id: true, rating: true, reviewCount: true, slug: true },
      }),
      this.reviewRepository.exists({ where: { user: { id: user.id }, place: { id: placeId } } }),
    ]);

    if (!place) throw new NotFoundException('Place not found');
    if (userHasReview) throw new BadRequestException('You have already reviewed this place');

    const review = this.reviewRepository.create({ ...reviewData, place: { id: placeId }, user: { id: user.id } });
    await this.reviewRepository.save(review);

    place.rating = await this.getAverageRating(placeId);
    place.reviewCount += 1;
    this.placeRepository.save(place);

    review.place = place;
    // ! Presenta deuda tecnica ya que esto no debería ejecutarse aquí,
    // ! sino en un servicio aparte y que pueda manejar errores y en segundo plano
    this.saveImages({ images, review, place, user });

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
  async findOne(reviewId: string, userId: string, placeId: string): Promise<any> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, user: { id: userId }, place: { id: placeId } },
      select: { place: { id: true }, images: true },
      relations: { images: { image: true }, place: true },
    });
    if (!review) throw new NotFoundException('Review not found');

    return {
      ...review,
      images: review.images.map(({ image, ...rest }) => ({
        ...rest,
        url: image.url,
      })),
    };
  }

  async findUserReview({ userId, placeId }: { userId: string; placeId: string }): Promise<Review | null> {
    return this.reviewRepository.findOne({ where: { user: { id: userId }, place: { id: placeId } } });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async update({
    reviewId,
    user,
    placeId,
    reviewDto,
  }: {
    reviewId: string;
    user: User;
    placeId: string;
    reviewDto: UpdateReviewDto;
  }) {
    const [review, place] = await Promise.all([
      this.reviewRepository.findOne({ where: { id: reviewId, user: { id: user.id }, place: { id: placeId } } }),
      this.placeRepository.findOne({
        where: { id: placeId },
        select: { id: true, rating: true, reviewCount: true, slug: true },
      }),
    ]);
    if (!review || !place) throw new NotFoundException('Review not found');

    const { images, ...reviewData } = reviewDto;

    this.reviewRepository.merge(review, reviewData);
    await this.reviewRepository.save(review);

    place.rating = await this.getAverageRating(placeId);
    await this.placeRepository.save(place);

    if (images) this.saveImages({ images, review, place, user });

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
    if (!review || !place) throw new NotFoundException('Review not found');

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

  private async saveImages({
    images,
    review,
    place,
    user,
  }: {
    images: Array<Express.Multer.File>;
    review: Review;
    place: Place;
    user: User;
  }) {
    this.logger.log(`Compressing images`);
    const compressedImages = await Promise.all(
      images.map(async image => this.tinifyService.compressImageFromBuffer(image.buffer)),
    );

    const cloudinaryImages = await Promise.all(
      images.map(async (image, index) =>
        this.cloudinaryService.uploadImage({
          file: { ...image, buffer: compressedImages[index] },
          fileName: `${place.slug}-${index}`,
          folder: `${CLOUDINARY_FOLDERS.REVIEW_GALLERY}/${user.username}-${user.id}/${place.slug}`,
          preset: CloudinaryPresets.REVIEW_IMAGE,
        }),
      ),
    );

    const imageResources = cloudinaryImages.map((image, index) =>
      this.imageResourceRepository.create({
        ...image,
        fileName: `${place.slug}-${index}`,
        description: review.comment || undefined,
        provider: ResourceProvider.Cloudinary,
        resourceType: image?.type,
      }),
    );

    await this.imageResourceRepository.save(imageResources);

    const reviewImages = imageResources.map(({ id }) =>
      this.reviewImageRepository.create({
        review: { id: review.id },
        image: { id },
        status: ReviewStatusEnum.PENDING,
      }),
    );

    await this.reviewImageRepository.save(reviewImages);
  }
}
