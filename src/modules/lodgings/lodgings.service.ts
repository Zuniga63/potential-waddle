import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, In, Point, Repository } from 'typeorm';

import { Lodging, LodgingImage } from './entities';
import { CreateLodgingDto, LodgingFullDto, LodgingIndexDto, UpdateLodgingDto } from './dto';
import { LodgingFindAllParams } from './interfaces';
import { generateLodgingQueryFilters } from './utils';
import { Category, Facility, ImageResource } from '../core/entities';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { User } from '../users/entities';
import { Town } from '../towns/entities';
import { LodgingVectorDto } from './dto/lodging-vector.dto';

@Injectable()
export class LodgingsService {
  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRespository: Repository<Lodging>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Find all lodgings
  // ------------------------------------------------------------------------------------------------
  async findAll({ filters }: LodgingFindAllParams = {}) {
    const { where, order } = generateLodgingQueryFilters(filters);

    const relations: FindOptionsRelations<Lodging> = {
      town: { department: true },
      reviews: true,
      categories: { icon: true },
      images: { imageResource: true },
      user: true,
    };

    const lodgings = await this.lodgingRespository.find({ relations, order, where });

    return lodgings.map(lodgings => new LodgingIndexDto(lodgings));
  }

  // ------------------------------------------------------------------------------------------------
  // Find all public lodgings
  // ------------------------------------------------------------------------------------------------
  async findPublicLodgings({ filters }: LodgingFindAllParams = {}) {
    const shouldRandomize = filters?.sortBy === 'random';
    const { where, order } = generateLodgingQueryFilters(filters);
    let lodgings = await this.lodgingRespository.find({
      relations: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
      },
      order,
      where: {
        ...where,
        isPublic: true,
      },
    });

    // Only randomize if no specific order was requested
    if (shouldRandomize) {
      lodgings = lodgings.sort(() => Math.random() - 0.5);
    }
    return lodgings.map(lodging => new LodgingIndexDto(lodging));
  }

  // ------------------------------------------------------------------------------------------------
  // Find all public lodgings with full info
  // ------------------------------------------------------------------------------------------------
  async findPublicFullInfoLodgings({ filters }: LodgingFindAllParams = {}) {
    const shouldRandomize = filters?.sortBy === 'random';
    const { where, order } = generateLodgingQueryFilters(filters);
    let lodgings = await this.lodgingRespository.find({
      relations: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
        facilities: { icon: true },
      },
      order,
      where: {
        ...where,
        isPublic: true,
      },
    });

    // Only randomize if no specific order was requested
    if (shouldRandomize) {
      lodgings = lodgings.sort(() => Math.random() - 0.5);
    }
    return lodgings.map(lodging => new LodgingVectorDto(lodging));
  }
  // ------------------------------------------------------------------------------------------------
  // Find one lodging
  // ------------------------------------------------------------------------------------------------
  async findOne({ identifier }: { identifier: string }) {
    const relations: FindOptionsRelations<Lodging> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    let lodging = await this.lodgingRespository.findOne({
      where: { id: identifier },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!lodging) lodging = await this.lodgingRespository.findOne({ where: { id: identifier }, relations });
    if (!lodging) throw new NotFoundException('Lodging not found');

    return new LodgingFullDto(lodging);
  }

  // ------------------------------------------------------------------------------------------------
  // Find one lodging by slug
  // ------------------------------------------------------------------------------------------------
  async findOneBySlug({ slug }: { slug: string }) {
    const relations: FindOptionsRelations<Lodging> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    let lodging = await this.lodgingRespository.findOne({
      where: { slug },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!lodging) lodging = await this.lodgingRespository.findOne({ where: { slug }, relations });
    if (!lodging) throw new NotFoundException('Lodging not found');

    return new LodgingFullDto(lodging);
  }

  // ------------------------------------------------------------------------------------------------
  // Create lodging
  // ------------------------------------------------------------------------------------------------
  async create(createLodgingDto: CreateLodgingDto) {
    const { latitude, longitude, ...restCreateDto } = createLodgingDto;
    const location: Point | null =
      latitude && longitude
        ? {
            type: 'Point',
            coordinates: [longitude, latitude],
          }
        : null;

    const categories = createLodgingDto.categoryIds
      ? await this.categoryRepo.findBy({ id: In(createLodgingDto.categoryIds) })
      : [];
    const facilities = createLodgingDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(createLodgingDto.facilityIds) })
      : [];
    const town = await this.townRepository.findOne({ where: { id: createLodgingDto.townId } });
    const user = await this.userRepository.findOne({ where: { id: createLodgingDto.userId } });

    if (!town) {
      throw new NotFoundException('Town not found');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.lodgingRespository.save({
        ...restCreateDto,
        location: location as any,
        categories,
        facilities,
        town,
        user: user ?? undefined,
      });

      return { message: restCreateDto.name };
    } catch (error) {
      throw new BadRequestException(`Error creating lodging: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Update lodging
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateLodgingDto: UpdateLodgingDto) {
    const lodging = await this.lodgingRespository.findOne({ where: { id } });
    const categories = updateLodgingDto.categoryIds
      ? await this.categoryRepo.findBy({ id: In(updateLodgingDto.categoryIds) })
      : [];
    const facilities = updateLodgingDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(updateLodgingDto.facilityIds) })
      : [];
    if (!lodging) throw new NotFoundException('Lodging not found');

    // Extraer lat y lng del DTO y crear el Point
    const { latitude, longitude, ...restUpdateDto } = updateLodgingDto;
    const location =
      latitude && longitude
        ? {
            type: 'Point',
            coordinates: [longitude, latitude], // GeoJSON usa [longitude, latitude]
          }
        : null;

    await this.lodgingRespository.save({
      id: lodging.id,
      ...restUpdateDto,
      location: location as any,
      categories,
      user: lodging.user,
      facilities,
    });

    const relations: FindOptionsRelations<Lodging> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
      user: true,
    };

    const updatedLodging = await this.lodgingRespository.findOne({
      where: { id },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!updatedLodging) throw new NotFoundException('Lodging not found');

    return new LodgingFullDto(updatedLodging);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete lodging
  // ------------------------------------------------------------------------------------------------
  async delete(id: string) {
    const lodging = await this.lodgingRespository.findOne({
      where: { id },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!lodging) throw new NotFoundException('Lodging not found');

    try {
      // Delete everything in a single transaction
      await this.lodgingRespository.manager.transaction(async manager => {
        if (lodging.images && lodging.images.length > 0) {
          // 1. Delete images from Cloudinary
          await Promise.all(
            lodging.images.map(image =>
              image.imageResource.publicId
                ? this.cloudinaryService.destroyFile(image.imageResource.publicId)
                : Promise.resolve(),
            ),
          );

          // 2. Delete LodgingImage entries first
          await manager.delete(
            LodgingImage,
            lodging.images.map(image => image.id),
          );

          // 3. Delete ImageResource entries
          await manager.delete(
            ImageResource,
            lodging.images.map(image => image.imageResource.id),
          );
        }

        // 4. Finally delete the lodging
        await manager.delete(Lodging, { id: lodging.id });
      });

      // After all database operations are complete, delete the folder
      try {
        await this.cloudinaryService.destroyFolder(`${CLOUDINARY_FOLDERS.LODGING_GALLERY}/${lodging.slug}`);
      } catch (folderError) {
        console.warn(`Could not delete Cloudinary folder for lodging ${lodging.slug}:`, folderError);
        // Continue with the process, as the main deletion was successful
      }

      return { message: 'Lodging deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting lodging: ${JSON.stringify(error)}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Upload image
  // ------------------------------------------------------------------------------------------------
  async uploadImages(id: string, files: Express.Multer.File[]) {
    const lodging = await this.lodgingRespository.findOne({
      where: { id },
      relations: { images: { imageResource: true } },
    });

    if (!lodging) throw new NotFoundException('Lodging not found');

    try {
      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: lodging.name,
          preset: CloudinaryPresets.LODGING_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.LODGING_GALLERY}/${lodging.slug}`,
        });

        if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

        // Create and save the image resource
        const imageResource = await this.lodgingRespository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: lodging.name,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        await this.lodgingRespository.manager.save(ImageResource, imageResource);

        // Create and save the lodging image association
        const lodgingImage = await this.lodgingRespository.manager.create(LodgingImage, {
          imageResource,
          order: lodging.images.length + index + 1,
          lodging: { id: lodging.id },
        });

        await this.lodgingRespository.manager.save(LodgingImage, lodgingImage);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      return this.findOne({ identifier: lodging.id });
    } catch (error) {
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(id: string) {
    const lodging = await this.lodgingRespository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });
    console.log('images', lodging?.images.length);

    if (!lodging) throw new NotFoundException('Lodging not found');

    return lodging.images.sort((a, b) => a.order - b.order);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(id: string, imageId: string) {
    const lodging = await this.lodgingRespository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!lodging) throw new NotFoundException('Lodging not found');

    const image = lodging.images.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.lodgingRespository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = lodging.images
        .filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);

      await Promise.all(
        remainingImages.map((img, index) =>
          this.lodgingRespository.manager.update(LodgingImage, img.id, {
            order: index + 1,
          }),
        ),
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
    const lodging = await this.lodgingRespository.findOne({ where: { id: identifier } });
    if (!lodging) throw new NotFoundException('Lodging not found');

    const { newOrder } = reorderImagesDto;
    console.log(newOrder);
    await Promise.all(
      newOrder.map(({ id, order }) => this.lodgingRespository.manager.update(LodgingImage, id, { order })),
    );

    return { message: 'Images reordered successfully' };
  }

  // ------------------------------------------------------------------------------------------------
  // Update user in lodging
  // ------------------------------------------------------------------------------------------------
  async updateUser(identifier: string, userId: string) {
    const lodging = await this.lodgingRespository.findOne({ where: { id: identifier } });
    if (!lodging) throw new NotFoundException('Lodging not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    lodging.user = user;
    await this.lodgingRespository.save(lodging);

    return user;
  }

  async updateVisibility(identifier: string, isPublic: boolean) {
    const lodging = await this.lodgingRespository.findOne({ where: { id: identifier } });

    if (!lodging) {
      throw new NotFoundException('Lodging not found');
    }
    lodging.isPublic = isPublic;
    await this.lodgingRespository.save(lodging);
    return { message: 'Lodging visibility updated', data: isPublic };
  }

  async updateShowGoogleMapsReviews(identifier: string, showGoogleMapsReviews: boolean) {
    const lodging = await this.lodgingRespository.findOne({ where: { id: identifier } });
    if (!lodging) throw new NotFoundException('Lodging not found');
    lodging.showGoogleMapsReviews = showGoogleMapsReviews;
    await this.lodgingRespository.save(lodging);
    return { message: 'Lodging Google Maps Reviews visibility updated', data: showGoogleMapsReviews };
  }
}
