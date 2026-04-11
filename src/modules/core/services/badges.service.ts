import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, EntityBadge } from '../entities';
import { CreateBadgeDto, UpdateBadgeDto, AdminBadgesFiltersDto, AdminBadgesListDto } from '../dto';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { CloudinaryPresets } from 'src/config';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';

export type BadgeEntityType = 'lodging' | 'restaurant' | 'commerce' | 'guide' | 'transport';

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgesRepository: Repository<Badge>,
    @InjectRepository(EntityBadge)
    private readonly entityBadgeRepository: Repository<EntityBadge>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL BADGES PAGINATED (ADMIN)
  // * -------------------------------------------------------------------------------------------------------------
  async findAllPaginated(filters: AdminBadgesFiltersDto): Promise<AdminBadgesListDto> {
    const { page = 1, limit = 10, search, isEnabled, sortBy = 'name', sortOrder = 'ASC' } = filters;

    const queryBuilder = this.badgesRepository.createQueryBuilder('badge');

    if (search) {
      queryBuilder.andWhere('(badge.name ILIKE :search OR badge.slug ILIKE :search)', { search: `%${search}%` });
    }

    if (isEnabled !== undefined) {
      queryBuilder.andWhere('badge.isEnabled = :isEnabled', { isEnabled });
    }

    const validSortFields = ['name', 'slug', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.orderBy(`badge.${sortField}`, sortOrder);

    const count = await queryBuilder.getCount();
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      currentPage: page,
      pages: Math.ceil(count / limit),
      count,
      data,
    };
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW BADGE
  // * -------------------------------------------------------------------------------------------------------------
  async create(createBadgeDto: CreateBadgeDto) {
    const badge = this.badgesRepository.create(createBadgeDto);
    badge.isEnabled = createBadgeDto.isEnabled ?? true;
    return this.badgesRepository.save(badge);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL BADGES (PUBLIC)
  // * -------------------------------------------------------------------------------------------------------------
  async findAll() {
    return this.badgesRepository.find({
      where: { isEnabled: true },
      order: { name: 'ASC' },
    });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET BADGE BY ID
  // * -------------------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const badge = await this.badgesRepository.findOne({ where: { id } });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    return badge;
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE BADGE
  // * -------------------------------------------------------------------------------------------------------------
  async update(id: string, updateBadgeDto: UpdateBadgeDto) {
    const badge = await this.badgesRepository.findOne({ where: { id } });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    Object.assign(badge, updateBadgeDto);
    return this.badgesRepository.save(badge);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE BADGE
  // * -------------------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const badge = await this.badgesRepository.findOne({ where: { id } });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    await this.badgesRepository.remove(badge);
    return { message: 'Badge deleted successfully' };
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPLOAD BADGE IMAGE
  // * -------------------------------------------------------------------------------------------------------------
  async uploadImage(id: string, file: Express.Multer.File) {
    const badge = await this.badgesRepository.findOne({ where: { id } });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    const cloudinaryRes = await this.cloudinaryService.uploadImage({
      file,
      fileName: `badge-${badge.slug}`,
      preset: CloudinaryPresets.DEFAULT,
      folder: CLOUDINARY_FOLDERS.BADGE_IMAGES,
    });

    if (!cloudinaryRes) {
      throw new BadRequestException('Error uploading image');
    }

    badge.imageUrl = cloudinaryRes.url;
    return this.badgesRepository.save(badge);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE BADGE IMAGE
  // * -------------------------------------------------------------------------------------------------------------
  async deleteImage(id: string) {
    const badge = await this.badgesRepository.findOne({ where: { id } });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    badge.imageUrl = undefined;
    return this.badgesRepository.save(badge);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET BADGES FOR AN ENTITY
  // * -------------------------------------------------------------------------------------------------------------
  async findBadgesByEntity(entityType: BadgeEntityType, entityId: string) {
    const entityBadges = await this.entityBadgeRepository.find({
      where: { entityType, entityId },
      relations: { badge: true },
    });

    return entityBadges.map(eb => eb.badge);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * ASSIGN BADGES TO AN ENTITY
  // * -------------------------------------------------------------------------------------------------------------
  async assignBadges(entityType: BadgeEntityType, entityId: string, badgeIds: string[]) {
    // Remove existing badges for this entity
    await this.entityBadgeRepository.delete({ entityType, entityId });

    // Create new assignments
    if (badgeIds.length > 0) {
      const entityBadges = badgeIds.map(badgeId =>
        this.entityBadgeRepository.create({ entityType, entityId, badgeId }),
      );
      await this.entityBadgeRepository.save(entityBadges);
    }

    return this.findBadgesByEntity(entityType, entityId);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * REMOVE A BADGE FROM AN ENTITY
  // * -------------------------------------------------------------------------------------------------------------
  async removeBadgeFromEntity(entityType: BadgeEntityType, entityId: string, badgeId: string) {
    await this.entityBadgeRepository.delete({ entityType, entityId, badgeId });
    return { message: 'Badge removed from entity' };
  }
}
