import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, In, Repository } from 'typeorm';
import { Guide } from './entities/guide.entity';
import { Category, ImageResource } from '../core/entities';
import { User } from '../users/entities';
import { GuideFindAllParams } from './interfaces/guide-find-all-params.interface';
import { GuidesListDto } from './dto/guides-list.dto';
import { GuideDto } from './dto/guide.dto';
import { generateGuideQueryFilters } from './utils/generate-guides-query-filters';
import { UserDto } from '../users/dto/user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { GuideImage } from './entities/guide-image.entity';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { ResourceProvider } from 'src/config/resource-provider.enum';
import { CloudinaryPresets } from 'src/config';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { GuideVectorDto } from './dto/guide-vector.dto';

@Injectable()
export class GuidesService {
  constructor(
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Create guide
  // ------------------------------------------------------------------------------------------------
  async create(createGuideDto: CreateGuideDto) {
    const { categories, ...restDto } = createGuideDto;
    const categoriesEntities = categories ? await this.categoryRepo.findBy({ id: In(categories) }) : [];
    const user = restDto.userId ? await this.userRepo.findOneBy({ id: restDto.userId }) : undefined;

    const guide = this.guideRepository.create({
      ...restDto,
      categories: categoriesEntities,
      user: user ?? undefined,
    });

    return await this.guideRepository.save(guide);
  }

  async findAll({ filters }: GuideFindAllParams = {}): Promise<GuidesListDto> {
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateGuideQueryFilters(filters);

    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      images: { imageResource: true },
      user: true,
    };

    const [guides, count] = await this.guideRepository.findAndCount({
      skip,
      take: limit,
      relations,
      order,
      where,
    });

    return new GuidesListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, guides);
  }

  async findPublicGuides({ filters }: GuideFindAllParams = {}): Promise<GuidesListDto> {
    console.log(filters, 'filters');
    const shouldRandomize = filters?.sortBy === 'random';
    const { page = 1, limit = 25 } = filters ?? {};
    const skip = (page - 1) * limit;
    const { where, order } = generateGuideQueryFilters(filters);

    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      images: { imageResource: true },
      user: true,
    };

    const [_guides, count] = await this.guideRepository.findAndCount({
      skip,
      take: limit,
      relations,
      order,
      where: {
        ...where,
        isPublic: true,
      },
    });
    const guides = _guides;

    if (shouldRandomize) {
      // Fisher-Yates shuffle algorithm for better randomization
      for (let i = guides.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [guides[i], guides[j]] = [guides[j], guides[i]];
      }
    }

    return new GuidesListDto({ currentPage: page, pages: Math.ceil(count / limit), count }, guides);
  }

  async findPublicFullInfoGuides(): Promise<GuideVectorDto[]> {
    const { where, order } = generateGuideQueryFilters({});

    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      images: { imageResource: true },
      user: true,
      experiences: {
        images: { imageResource: true },
        categories: { icon: true },
      },
    };

    const guides = await this.guideRepository.find({
      relations,
      order,
      where: {
        ...where,
        isPublic: true,
      },
    });

    return guides.map(guide => new GuideVectorDto({ data: guide }));
  }

  // ------------------------------------------------------------------------------------------------
  // Find one guide
  // ------------------------------------------------------------------------------------------------
  async findOne({ identifier }: { identifier: string }) {
    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      user: true,
      images: { imageResource: true },
      experiences: {
        images: { imageResource: true },
        categories: { icon: true },
      },
    };

    const guide = await this.guideRepository.findOne({ where: { slug: identifier }, relations });
    if (!guide) throw new NotFoundException('Guide not found');
    return new GuideDto({ data: guide });
  }

  async findOneById(id: string) {
    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      user: true,
      images: { imageResource: true },
      experiences: {
        images: { imageResource: true },
        categories: { icon: true },
      },
    };

    const guide = await this.guideRepository.findOne({ where: { id }, relations });
    if (!guide) throw new NotFoundException('Guide not found');
    return new GuideDto({ data: guide });
  }

  // ------------------------------------------------------------------------------------------------
  // Update guide
  // ------------------------------------------------------------------------------------------------
  async update(slug: string, updateGuideDto: UpdateGuideDto) {
    const { categories, userId, ...restDto } = updateGuideDto;
    const categoriesEntities = categories ? await this.categoryRepo.findBy({ id: In(categories) }) : [];
    const user = userId ? await this.userRepo.findOneBy({ id: userId }) : undefined;
    const guide = await this.guideRepository.findOne({ where: { slug } });
    if (!guide) throw new NotFoundException('Guide not found');

    const updatedGuide = await this.guideRepository.save({
      ...guide,
      ...restDto,
      categories: categoriesEntities || [],
      user: user || undefined,
    });

    return new UserDto(updatedGuide.user);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete guide
  // ------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!guide) throw new NotFoundException('Guide not found');

    try {
      // Delete everything in a single transaction
      await this.guideRepository.manager.transaction(async manager => {
        if (guide.images && guide.images.length > 0) {
          // 1. Delete images from Cloudinary
          await Promise.all(
            guide.images.map(image =>
              image.imageResource.publicId
                ? this.cloudinaryService.destroyFile(image.imageResource.publicId)
                : Promise.resolve(),
            ),
          );

          // 2. Delete GuideImage entries first
          await manager.delete(
            GuideImage,
            guide.images.map(image => image.id),
          );

          // 3. Delete ImageResource entries
          await manager.delete(
            ImageResource,
            guide.images.map(image => image.imageResource.id),
          );
        }

        // 4. Finally delete the guide
        await manager.delete(Guide, { id: guide.id });
      });

      // After all database operations are complete, delete the folder
      try {
        await this.cloudinaryService.destroyFolder(`${CLOUDINARY_FOLDERS.GUIDE_GALLERY}/${guide.slug}`);
      } catch (folderError) {
        console.warn(`Could not delete Cloudinary folder for guide ${guide.slug}:`, folderError);
        // Continue with the process, as the main deletion was successful
      }

      return { message: 'Guide deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting guide: ${JSON.stringify(error)}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Update guide availability
  // ------------------------------------------------------------------------------------------------
  async updateAvailability(id: string, isAvailable: boolean) {
    const guide = await this.guideRepository.findOne({ where: { id } });
    if (!guide) throw new NotFoundException('Guide not found');

    return this.guideRepository.save({
      ...guide,
      isAvailable,
    });
  }

  // ------------------------------------------------------------------------------------------------
  // Upload image
  // ------------------------------------------------------------------------------------------------
  async uploadImages(id: string, files: Express.Multer.File[]) {
    const guide = await this.guideRepository.findOne({
      where: { id },
      relations: { images: { imageResource: true } },
    });

    if (!guide) throw new NotFoundException('Guide not found');

    try {
      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: guide.firstName,
          preset: CloudinaryPresets.LODGING_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.GUIDE_GALLERY}/${guide.slug}`,
        });

        if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

        // Create and save the image resource
        const imageResource = await this.guideRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: guide.firstName,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        await this.guideRepository.manager.save(ImageResource, imageResource);

        // Create and save the guide image association
        const guideImage = await this.guideRepository.manager.create(GuideImage, {
          imageResource,
          order: (guide.images || []).length + index + 1,
          guide: { id: guide.id },
        });

        await this.guideRepository.manager.save(GuideImage, guideImage);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      return this.findOne({ identifier: guide.slug });
    } catch (error) {
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(id: string) {
    const guide = await this.guideRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!guide) throw new NotFoundException('Guide not found');

    return guide.images?.sort((a, b) => a.order - b.order);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(id: string, imageId: string) {
    const guide = await this.guideRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!guide) throw new NotFoundException('Guide not found');

    const image = guide.images?.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.guideRepository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = guide.images
        ?.filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);
      await Promise.all(
        remainingImages?.map((img, index) =>
          this.guideRepository.manager.update(GuideImage, img.id, {
            order: index + 1,
          }),
        ) || [],
      );

      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Error deleting image ' + error);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Reorder images
  // ------------------------------------------------------------------------------------------------
  async reorderImages(identifier: string, reorderImagesDto: ReorderImagesDto) {
    const guide = await this.guideRepository.findOne({ where: { id: identifier } });
    if (!guide) throw new NotFoundException('Guide not found');

    const { newOrder } = reorderImagesDto;
    console.log(newOrder);
    await Promise.all(newOrder.map(({ id, order }) => this.guideRepository.manager.update(GuideImage, id, { order })));

    return { message: 'Images reordered successfully' };
  }

  async findOrderedGuides({ filters }: GuideFindAllParams = {}): Promise<Guide[]> {
    const { order } = generateGuideQueryFilters(filters);

    const relations: FindOptionsRelations<Guide> = {
      categories: { icon: true },
      images: { imageResource: true },
      user: true,
    };

    const guides = await this.guideRepository.find({
      relations,
      order: Object.keys(order || {}).length > 0 ? order : { id: 'DESC' },
      where: {
        isPublic: true,
      },
    });

    if (Object.keys(order || {}).length === 0) {
      guides.sort(() => Math.random() - 0.5);
    }

    return guides;
  }
  // ------------------------------------------------------------------------------------------------
  // Update user in lodging
  // ------------------------------------------------------------------------------------------------
  async updateUser(identifier: string, userId: string) {
    const guide = await this.guideRepository.findOne({ where: { id: identifier } });
    if (!guide) throw new NotFoundException('Guide not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    guide.user = user;
    await this.guideRepository.save(guide);

    return user;
  }

  // ------------------------------------------------------------------------------------------------
  // Update visibility
  // ------------------------------------------------------------------------------------------------
  async updateVisibility(identifier: string, isPublic: boolean) {
    const guide = await this.guideRepository.findOne({ where: { id: identifier } });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }
    guide.isPublic = isPublic;
    await this.guideRepository.save(guide);
    return { message: 'Guide visibility updated', data: isPublic };
  }
}
