import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Review, ReviewImage } from '../entities';
import { ReviewDomainsEnum, ReviewStatusEnum } from '../enums';
import { CreateReviewDto, UpdateReviewDto } from '../dto';
import { User, UserPoint } from 'src/modules/users/entities';
import { ImageResource } from 'src/modules/core/entities';
import { TinifyService } from 'src/modules/tinify/tinify.service';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { CloudinaryPresets, ResourceProvider } from 'src/config';

// Entities
import { Lodging } from 'src/modules/lodgings/entities';
import { Restaurant } from 'src/modules/restaurants/entities';
import { Commerce } from 'src/modules/commerce/entities';
import { Experience } from 'src/modules/experiences/entities';
import { Transport } from 'src/modules/transport/entities';
import { Guide } from 'src/modules/guides/entities';

// Entidades auto-aprobadas (puntos inmediatos)
const AUTO_APPROVED_ENTITIES = [
  ReviewDomainsEnum.LODGINGS,
  ReviewDomainsEnum.RESTAURANTS,
  ReviewDomainsEnum.COMMERCE,
  ReviewDomainsEnum.EXPERIENCES,
  ReviewDomainsEnum.TRANSPORT,
  ReviewDomainsEnum.GUIDES,
];

// Tipo para entidades que pueden tener reviews
type ReviewableEntity = {
  id: string;
  rating: number;
  reviewCount?: number;
  reviewsCount?: number; // Experience usa reviewsCount
  points: number;
  slug?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  town?: { id: string };
};

@Injectable()
export class EntityReviewsService {
  private logger = new Logger(EntityReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,

    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,

    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,

    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,

    @InjectRepository(ImageResource)
    private readonly imageResourceRepository: Repository<ImageResource>,

    @InjectRepository(ReviewImage)
    private readonly reviewImageRepository: Repository<ReviewImage>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserPoint)
    private readonly userPointRepository: Repository<UserPoint>,

    private readonly dataSource: DataSource,
    private readonly tinifyService: TinifyService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async create({
    entityType,
    entityId,
    user,
    reviewDto,
  }: {
    entityType: ReviewDomainsEnum;
    entityId: string;
    user: User;
    reviewDto: CreateReviewDto;
  }) {
    const { images, ...reviewData } = reviewDto;

    // Obtener repositorio y clave de relación
    const repository = this.getEntityRepository(entityType);
    const relationKey = this.getEntityRelationKey(entityType);

    // Verificar que la entidad existe y que el usuario no ha dejado review
    const [entity, userHasReview] = await Promise.all([
      repository.findOne({
        where: { id: entityId },
        relations: { town: true },
      }),
      this.reviewRepository.exists({
        where: { user: { id: user.id }, [relationKey]: { id: entityId } },
      }),
    ]);

    if (!entity) throw new NotFoundException(`${entityType} not found`);
    if (userHasReview) throw new BadRequestException(`You have already reviewed this ${entityType}`);

    // Determinar si es auto-aprobada
    const isAutoApproved = this.isAutoApproved(entityType);
    const status = isAutoApproved ? ReviewStatusEnum.APPROVED : ReviewStatusEnum.PENDING;

    // Crear review
    const reviewData2: any = {
      ...reviewData,
      [relationKey]: { id: entityId },
      user: { id: user.id },
      status,
    };
    if (isAutoApproved) {
      reviewData2.approvedAt = new Date();
    }
    const review = this.reviewRepository.create(reviewData2 as Partial<Review>);
    await this.reviewRepository.save(review);

    // Actualizar rating y reviewCount solo si está aprobada
    if (isAutoApproved) {
      entity.rating = await this.getAverageRating(entityType, entityId);
      // Soportar tanto reviewCount como reviewsCount (Experience usa reviewsCount)
      if ('reviewsCount' in entity) {
        entity.reviewsCount = (entity.reviewsCount || 0) + 1;
      } else {
        entity.reviewCount = (entity.reviewCount || 0) + 1;
      }
      await repository.save(entity);

      // Asignar puntos inmediatamente
      await this.assignPoints({
        user,
        entity,
        entityType,
        review,
      });
    }

    // Guardar imágenes
    if (images && images.length > 0) {
      await this.saveImages({
        images,
        review,
        entitySlug: this.getEntitySlug(entity),
        user,
      });
    }

    return { ...review, [relationKey]: entity };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * FIND ALL REVIEWS FOR ENTITY
  // * ----------------------------------------------------------------------------------------------------------------
  async findAll({
    entityType,
    entityId,
    status,
  }: {
    entityType: ReviewDomainsEnum;
    entityId: string;
    status?: ReviewStatusEnum;
  }) {
    const relationKey = this.getEntityRelationKey(entityType);

    const where: any = { [relationKey]: { id: entityId } };
    if (status) where.status = status;

    return this.reviewRepository.find({
      where,
      relations: { user: true, images: { image: true } },
      order: { createdAt: 'DESC' },
    });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * FIND USER REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async findUserReview({
    entityType,
    entityId,
    userId,
  }: {
    entityType: ReviewDomainsEnum;
    entityId: string;
    userId: string;
  }) {
    const relationKey = this.getEntityRelationKey(entityType);

    const review = await this.reviewRepository.findOne({
      where: { user: { id: userId }, [relationKey]: { id: entityId } },
      relations: { images: { image: true } },
    });

    if (!review) return null;

    return {
      ...review,
      images: review.images?.map(({ image, ...rest }) => ({
        ...rest,
        url: image?.url,
      })),
    };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * FIND ONE REVIEW BY ID (throws NotFoundException if not found - like Places)
  // * ----------------------------------------------------------------------------------------------------------------
  async findOne({
    entityType,
    entityId,
    reviewId,
    userId,
  }: {
    entityType: ReviewDomainsEnum;
    entityId: string;
    reviewId: string;
    userId: string;
  }) {
    const relationKey = this.getEntityRelationKey(entityType);

    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, user: { id: userId }, [relationKey]: { id: entityId } },
      relations: { images: { image: true }, [relationKey]: true },
    });

    if (!review) throw new NotFoundException('Review not found');

    return {
      ...review,
      images: review.images?.map(({ image, ...rest }) => ({
        ...rest,
        url: image?.url,
      })),
    };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async update({
    entityType,
    entityId,
    reviewId,
    user,
    reviewDto,
  }: {
    entityType: ReviewDomainsEnum;
    entityId: string;
    reviewId: string;
    user: User;
    reviewDto: UpdateReviewDto;
  }) {
    const repository = this.getEntityRepository(entityType);
    const relationKey = this.getEntityRelationKey(entityType);

    const [review, entity] = await Promise.all([
      this.reviewRepository.findOne({
        where: { id: reviewId, user: { id: user.id }, [relationKey]: { id: entityId } },
      }),
      repository.findOne({
        where: { id: entityId },
      }),
    ]);

    if (!review || !entity) throw new NotFoundException('Review not found');

    const { images, ...reviewData } = reviewDto;

    this.reviewRepository.merge(review, reviewData);
    await this.reviewRepository.save(review);

    // Recalcular rating si la review está aprobada
    if (review.status === ReviewStatusEnum.APPROVED) {
      entity.rating = await this.getAverageRating(entityType, entityId);
      await repository.save(entity);
    }

    if (images && images.length > 0) {
      await this.saveImages({
        images,
        review,
        entitySlug: this.getEntitySlug(entity),
        user,
      });
    }

    return { ...review, [relationKey]: entity };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE REVIEW
  // * ----------------------------------------------------------------------------------------------------------------
  async remove({
    entityType,
    entityId,
    reviewId,
    userId,
  }: {
    entityType: ReviewDomainsEnum;
    entityId: string;
    reviewId: string;
    userId: string;
  }) {
    const repository = this.getEntityRepository(entityType);
    const relationKey = this.getEntityRelationKey(entityType);

    const [review, entity] = await Promise.all([
      this.reviewRepository.findOne({
        where: { id: reviewId, user: { id: userId }, [relationKey]: { id: entityId } },
      }),
      repository.findOne({
        where: { id: entityId },
      }),
    ]);

    if (!review || !entity) throw new NotFoundException('Review not found');

    const wasApproved = review.status === ReviewStatusEnum.APPROVED;

    await this.reviewRepository.remove(review);

    // Actualizar rating y count solo si estaba aprobada
    if (wasApproved) {
      entity.rating = await this.getAverageRating(entityType, entityId);
      // Soportar tanto reviewCount como reviewsCount (Experience usa reviewsCount)
      if ('reviewsCount' in entity) {
        entity.reviewsCount = Math.max(0, (entity.reviewsCount || 0) - 1);
      } else {
        entity.reviewCount = Math.max(0, (entity.reviewCount || 0) - 1);
      }
      await repository.save(entity);
    }

    return { success: true };
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET USER REVIEWS FOR ENTITY TYPE
  // * ----------------------------------------------------------------------------------------------------------------
  async getUserReviews({
    entityType,
    userId,
  }: {
    entityType: ReviewDomainsEnum;
    userId: string;
  }): Promise<Review[]> {
    const relationKey = this.getEntityRelationKey(entityType);

    return this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: { [relationKey]: true },
    });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * PRIVATE METHODS
  // * ----------------------------------------------------------------------------------------------------------------

  private getEntityRepository(entityType: ReviewDomainsEnum): Repository<any> {
    const repositoryMap: Record<string, Repository<any> | undefined> = {
      [ReviewDomainsEnum.LODGINGS]: this.lodgingRepository,
      [ReviewDomainsEnum.RESTAURANTS]: this.restaurantRepository,
      [ReviewDomainsEnum.COMMERCE]: this.commerceRepository,
      [ReviewDomainsEnum.EXPERIENCES]: this.experienceRepository,
      [ReviewDomainsEnum.TRANSPORT]: this.transportRepository,
      [ReviewDomainsEnum.GUIDES]: this.guideRepository,
      // PLACES usa PlaceReviewsService, no se maneja aquí
    };

    const repo = repositoryMap[entityType];
    if (!repo) throw new BadRequestException(`Entity type ${entityType} not supported by EntityReviewsService`);
    return repo;
  }

  private getEntityRelationKey(entityType: ReviewDomainsEnum): string {
    const keyMap: Record<ReviewDomainsEnum, string> = {
      [ReviewDomainsEnum.LODGINGS]: 'lodging',
      [ReviewDomainsEnum.RESTAURANTS]: 'restaurant',
      [ReviewDomainsEnum.COMMERCE]: 'commerce',
      [ReviewDomainsEnum.EXPERIENCES]: 'experience',
      [ReviewDomainsEnum.TRANSPORT]: 'transport',
      [ReviewDomainsEnum.GUIDES]: 'guide',
      [ReviewDomainsEnum.PLACES]: 'place',
    };
    return keyMap[entityType];
  }

  private getEntityColumnName(entityType: ReviewDomainsEnum): string {
    const columnMap: Record<ReviewDomainsEnum, string> = {
      [ReviewDomainsEnum.LODGINGS]: 'lodging_id',
      [ReviewDomainsEnum.RESTAURANTS]: 'restaurant_id',
      [ReviewDomainsEnum.COMMERCE]: 'commerce_id',
      [ReviewDomainsEnum.EXPERIENCES]: 'experience_id',
      [ReviewDomainsEnum.TRANSPORT]: 'transport_id',
      [ReviewDomainsEnum.GUIDES]: 'guide_id',
      [ReviewDomainsEnum.PLACES]: 'place_id',
    };
    return columnMap[entityType];
  }

  private isAutoApproved(entityType: ReviewDomainsEnum): boolean {
    return AUTO_APPROVED_ENTITIES.includes(entityType);
  }

  private getEntitySlug(entity: ReviewableEntity): string {
    if (entity.slug) return entity.slug;
    if (entity.firstName && entity.lastName) return `${entity.firstName}-${entity.lastName}`.toLowerCase();
    if (entity.name) return entity.name.toLowerCase().replace(/\s+/g, '-');
    return entity.id;
  }

  private async getAverageRating(entityType: ReviewDomainsEnum, entityId: string): Promise<number> {
    try {
      const columnName = this.getEntityColumnName(entityType);

      const { avg } = await this.reviewRepository
        .createQueryBuilder()
        .select('AVG(rating)', 'avg')
        .where(`${columnName} = :id`, { id: entityId })
        .andWhere('status = :status', { status: ReviewStatusEnum.APPROVED })
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
    entitySlug,
    user,
  }: {
    images: Array<Express.Multer.File>;
    review: Review;
    entitySlug: string;
    user: User;
  }) {
    try {
      this.logger.log(`Compressing ${images.length} images`);
      const compressedImages = await Promise.all(
        images.map(async image => this.tinifyService.compressImageFromBuffer(image.buffer)),
      );

      const cloudinaryImages = await Promise.all(
        images.map(async (image, index) =>
          this.cloudinaryService.uploadImage({
            file: { ...image, buffer: compressedImages[index] },
            fileName: `${entitySlug}-${index}`,
            folder: `${CLOUDINARY_FOLDERS.REVIEW_GALLERY}/${user.username}-${user.id}/${entitySlug}`,
            preset: CloudinaryPresets.REVIEW_IMAGE,
          }),
        ),
      );

      const imageResources = cloudinaryImages.map((image, index) =>
        this.imageResourceRepository.create({
          ...image,
          fileName: `${entitySlug}-${index}`,
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
    } catch (error) {
      this.logger.error('Error saving images:', error);
    }
  }

  private async assignPoints({
    user,
    entity,
    entityType,
    review,
  }: {
    user: User;
    entity: ReviewableEntity;
    entityType: ReviewDomainsEnum;
    review: Review;
  }) {
    try {
      const points = entity.points || 0;
      if (points === 0) return;

      const townId = entity.town?.id;
      if (!townId) {
        this.logger.warn(`No town found for ${entityType} ${entity.id}, skipping points assignment`);
        return;
      }

      // Verificar si ya tiene puntos por esta entidad
      const existingPoint = await this.userPointRepository.findOne({
        where: {
          user: { id: user.id },
          review: { id: review.id },
        },
      });

      if (existingPoint) return;

      // Incrementar puntos del usuario
      await this.userRepository.increment({ id: user.id }, 'totalPoints', points);
      await this.userRepository.increment({ id: user.id }, 'rankingPoints', points);
      await this.userRepository.increment({ id: user.id }, 'remainingPoints', points);

      // Crear registro de puntos
      const pointRecord = this.userPointRepository.create({
        user: { id: user.id },
        town: { id: townId },
        review: { id: review.id },
        pointsEarned: points,
        pointsReedemed: 0,
        distanceTravelled: 0,
      });

      await this.userPointRepository.save(pointRecord);
      this.logger.log(`Assigned ${points} points to user ${user.id} for ${entityType} review`);
    } catch (error) {
      this.logger.error('Error assigning points:', error);
    }
  }
}
