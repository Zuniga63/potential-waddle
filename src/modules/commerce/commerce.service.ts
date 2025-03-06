import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FindOptionsRelations, In, Point } from 'typeorm';
import { Commerce, CommerceImage } from './entities';
import { CreateCommerceDto, UpdateCommerceDto, CommerceIndexDto, CommerceFullDto } from './dto';
import { Facility, ImageResource } from '../core/entities';
import { Category } from '../core/entities';
import { Town } from '../towns/entities';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets } from 'src/config/cloudinary-presets.enum';
import { ResourceProvider } from 'src/config/resource-provider.enum';
import { User } from '../users/entities';
import { CommerceFindAllParams } from './interfaces';
import { generateCommerceQueryFiltersAndSort } from './logic/generate-commerce-query-filters-and-sort';

@Injectable()
export class CommerceService {
  constructor(
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll({ filters }: CommerceFindAllParams = {}) {
    const { where, order } = generateCommerceQueryFiltersAndSort(filters);
    const commerces = await this.commerceRepository.find({
      relations: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
        user: true,
      },
      where,
      order,
    });

    return commerces.map(commerce => new CommerceIndexDto(commerce));
  }

  async findOne(id: string) {
    const commerce = await this.commerceRepository.findOne({
      where: { id },
      relations: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
        facilities: { icon: true },
      },
    });

    if (!commerce) throw new NotFoundException(`Commerce with id ${id} not found`);
    return new CommerceFullDto(commerce);
  }

  // ------------------------------------------------------------------------------------------------
  // Find one commerce by slug
  // ------------------------------------------------------------------------------------------------
  async findOneBySlug({ slug }: { slug: string }) {
    const relations: FindOptionsRelations<Commerce> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    let commerce = await this.commerceRepository.findOne({
      where: { slug },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!commerce) commerce = await this.commerceRepository.findOne({ where: { slug }, relations });
    if (!commerce) throw new NotFoundException('Commerce not found');

    return new CommerceFullDto(commerce);
  }

  // ------------------------------------------------------------------------------------------------
  // Create commerce
  // ------------------------------------------------------------------------------------------------
  async create(createCommerceDto: CreateCommerceDto) {
    const { latitude, longitude, ...restCreateDto } = createCommerceDto;
    const restaurantLocation: Point | null =
      latitude && longitude
        ? {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          }
        : null;

    const categories = createCommerceDto.categoryIds
      ? await this.categoryRepository.findBy({ id: In(createCommerceDto.categoryIds) })
      : [];
    const facilities = createCommerceDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(createCommerceDto.facilityIds) })
      : [];
    const town = await this.townRepository.findOne({ where: { id: createCommerceDto.townId } });

    if (!town) {
      throw new NotFoundException('Town not found');
    }
    try {
      await this.commerceRepository.save({
        ...restCreateDto,
        location: restaurantLocation ?? undefined,
        categories,
        facilities,
        town: town ?? undefined,
      });

      return { message: restCreateDto.name };
    } catch (error) {
      throw new BadRequestException(`Error creating commerce: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Update commerce
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateCommerceDto: UpdateCommerceDto) {
    const commerce = await this.commerceRepository.findOne({ where: { id } });
    const categories = updateCommerceDto.categoryIds
      ? await this.categoryRepository.findBy({ id: In(updateCommerceDto.categoryIds) })
      : [];
    const facilities = updateCommerceDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(updateCommerceDto.facilityIds) })
      : [];
    if (!commerce) throw new NotFoundException('Commerce not found');
    const town = await this.townRepository.findOne({ where: { id: updateCommerceDto.townId } });

    // Extract lat and lng from DTO and create Point
    const { latitude, longitude, ...restUpdateDto } = updateCommerceDto;
    const commerceLocation: Point | null =
      latitude && longitude
        ? {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          }
        : null;

    await this.commerceRepository.save({
      id: commerce.id,
      ...restUpdateDto,
      location: commerceLocation ?? undefined,
      categories,
      facilities,
      town: town ?? undefined,
    });

    const relations: FindOptionsRelations<Commerce> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    const updatedCommerce = await this.commerceRepository.findOne({
      where: { id },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!updatedCommerce) throw new NotFoundException('Commerce not found');
    return { message: updatedCommerce.name };
  }

  // ------------------------------------------------------------------------------------------------
  // Delete commerce
  // ------------------------------------------------------------------------------------------------
  async delete(id: string) {
    const commerce = await this.commerceRepository.findOne({
      where: { id },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!commerce) throw new NotFoundException('Commerce not found');

    try {
      // Delete everything in a single transaction
      await this.commerceRepository.manager.transaction(async manager => {
        if (commerce.images && commerce.images.length > 0) {
          // 1. Delete images from Cloudinary
          await Promise.all(
            commerce.images.map(image =>
              image.imageResource.publicId
                ? this.cloudinaryService.destroyFile(image.imageResource.publicId)
                : Promise.resolve(),
            ),
          );

          // 2. Delete RestaurantImage first
          await manager.delete(
            CommerceImage,
            commerce.images.map(image => image.id),
          );

          // 3. Delete ImageResource
          await manager.delete(
            ImageResource,
            commerce.images.map(image => image.imageResource.id),
          );
        }

        // 4. Finally delete the restaurant
        await manager.delete(Commerce, { id: commerce.id });
      });

      // After all database operations complete, delete the folder
      try {
        await this.cloudinaryService.destroyFolder(`${CLOUDINARY_FOLDERS.RESTAURANT_GALLERY}/${commerce.slug}`);
      } catch (folderError) {
        console.warn(`Could not delete Cloudinary folder for restaurant ${commerce.slug}:`, folderError);
        // Continue with the process, as the main deletion was successful
      }

      return { message: 'Commerce deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting commerce: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Upload images
  // ------------------------------------------------------------------------------------------------
  async uploadImages(id: string, files: Express.Multer.File[]) {
    const commerce = await this.commerceRepository.findOne({
      where: { id },
      relations: { images: { imageResource: true } },
    });

    if (!commerce) throw new NotFoundException('Commerce not found');

    try {
      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: commerce.name,
          preset: CloudinaryPresets.RESTAURANT_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.RESTAURANT_GALLERY}/${commerce.slug}`,
        });

        if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

        // Create and save the image resource
        const imageResource = await this.commerceRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: commerce.name,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        await this.commerceRepository.manager.save(ImageResource, imageResource);

        // Create and save the restaurant image association
        const commerceImage = await this.commerceRepository.manager.create(CommerceImage, {
          imageResource,
          order: (commerce.images?.length || 0) + index + 1,
          commerce: { id: commerce.id },
        });

        await this.commerceRepository.manager.save(CommerceImage, commerceImage);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      return this.findOne(commerce.id);
    } catch (error) {
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(id: string) {
    const commerce = await this.commerceRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!commerce) throw new NotFoundException('Commerce not found');

    return commerce.images?.sort((a, b) => a.order - b.order);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(id: string, imageId: string) {
    const commerce = await this.commerceRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!commerce) throw new NotFoundException('Commerce not found');

    const image = commerce.images?.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.commerceRepository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = commerce.images
        ?.filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);
      if (remainingImages?.length) {
        await Promise.all(
          remainingImages.map((img, index) =>
            this.commerceRepository.manager.update(CommerceImage, img.id, {
              order: index + 1,
            }),
          ),
        );
      }

      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Error deleting image ' + error);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Reorder images
  // ------------------------------------------------------------------------------------------------
  async reorderImages(identifier: string, reorderImagesDto: ReorderImagesDto) {
    const commerce = await this.commerceRepository.findOne({ where: { id: identifier } });
    if (!commerce) throw new NotFoundException('Commerce not found');

    const { newOrder } = reorderImagesDto;
    await Promise.all(
      newOrder.map(({ id, order }) => this.commerceRepository.manager.update(CommerceImage, id, { order })),
    );

    return { message: 'Images reordered successfully' };
  }

  // ------------------------------------------------------------------------------------------------
  // Update user in lodging
  // ------------------------------------------------------------------------------------------------
  async updateUser(identifier: string, userId: string) {
    const commerce = await this.commerceRepository.findOne({ where: { id: identifier } });
    if (!commerce) throw new NotFoundException('Commerce not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    commerce.user = user;
    await this.commerceRepository.save(commerce);

    return user;
  }

  // ------------------------------------------------------------------------------------------------
  // Update visibility
  // ------------------------------------------------------------------------------------------------
  async updateVisibility(identifier: string, isPublic: boolean) {
    const commerce = await this.commerceRepository.findOne({ where: { id: identifier } });

    if (!commerce) throw new NotFoundException('Commerce not found');
    commerce.isPublic = isPublic;
    await this.commerceRepository.save(commerce);
    return { message: 'Commerce visibility updated', data: isPublic };
  }
}
