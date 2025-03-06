import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FindOptionsRelations, In, Point } from 'typeorm';

import { RestaurantDto, CreateRestaurantDto, UpdateRestaurantDto } from './dto';
import { Restaurant, RestaurantImage } from './entities';
import { RestaurantFindAllParams } from './interfaces';
import { generateRestaurantQueryFiltersAndSort } from './logic';
import { Facility, ImageResource } from '../core/entities';
import { Category } from '../core/entities';
import { Town } from '../towns/entities';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets } from 'src/config/cloudinary-presets.enum';
import { ResourceProvider } from 'src/config/resource-provider.enum';
import { User } from '../users/entities';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

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

  async findAll({ filters }: RestaurantFindAllParams = {}) {
    const { where, order } = generateRestaurantQueryFiltersAndSort(filters);
    const restaurants = await this.restaurantRepository.find({
      relations: { town: { department: true }, categories: { icon: true }, images: { imageResource: true } },
      where,
      order,
    });

    return restaurants.map(restaurant => new RestaurantDto({ data: restaurant }));
  }

  async findOne(id: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
        facilities: { icon: true },
      },
    });

    if (!restaurant) throw new NotFoundException(`Restaurant with id ${id} not found`);
    return new RestaurantDto({ data: restaurant });
  }

  // ------------------------------------------------------------------------------------------------
  // Find one restaurant by slug
  // ------------------------------------------------------------------------------------------------
  async findOneBySlug({ slug }: { slug: string }) {
    const relations: FindOptionsRelations<Restaurant> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    let restaurant = await this.restaurantRepository.findOne({
      where: { slug },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!restaurant) restaurant = await this.restaurantRepository.findOne({ where: { slug }, relations });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return new RestaurantDto({ data: restaurant });
  }

  // ------------------------------------------------------------------------------------------------
  // Create restaurant
  // ------------------------------------------------------------------------------------------------
  async create(createRestaurantDto: CreateRestaurantDto) {
    const { latitude, longitude, ...restCreateDto } = createRestaurantDto;
    const restaurantLocation: Point | null =
      latitude && longitude
        ? {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          }
        : null;

    const categories = createRestaurantDto.categoryIds
      ? await this.categoryRepository.findBy({ id: In(createRestaurantDto.categoryIds) })
      : [];
    const facilities = createRestaurantDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(createRestaurantDto.facilityIds) })
      : [];
    const town = await this.townRepository.findOne({ where: { id: createRestaurantDto.townId } });

    if (!town) {
      throw new NotFoundException('Town not found');
    }
    try {
      await this.restaurantRepository.save({
        ...restCreateDto,
        location: restaurantLocation ?? undefined,
        categories,
        facilities,
        town: town ?? undefined,
      });

      return { message: restCreateDto.name };
    } catch (error) {
      throw new BadRequestException(`Error creating restaurant: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Update restaurant
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });
    const categories = updateRestaurantDto.categoryIds
      ? await this.categoryRepository.findBy({ id: In(updateRestaurantDto.categoryIds) })
      : [];
    const facilities = updateRestaurantDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(updateRestaurantDto.facilityIds) })
      : [];
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    const town = await this.townRepository.findOne({ where: { id: updateRestaurantDto.townId } });

    // Extract lat and lng from DTO and create Point
    const { latitude, longitude, ...restUpdateDto } = updateRestaurantDto;
    const restaurantLocation: Point | null =
      latitude && longitude
        ? {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          }
        : null;

    await this.restaurantRepository.save({
      id: restaurant.id,
      ...restUpdateDto,
      location: restaurantLocation ?? undefined,
      categories,
      facilities,
      town: town ?? undefined,
    });

    const relations: FindOptionsRelations<Restaurant> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    const updatedRestaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!updatedRestaurant) throw new NotFoundException('Restaurant not found');
    return { message: updatedRestaurant.name };
  }

  // ------------------------------------------------------------------------------------------------
  // Delete restaurant
  // ------------------------------------------------------------------------------------------------
  async delete(id: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    try {
      // Delete everything in a single transaction
      await this.restaurantRepository.manager.transaction(async manager => {
        if (restaurant.images && restaurant.images.length > 0) {
          // 1. Delete images from Cloudinary
          await Promise.all(
            restaurant.images.map(image =>
              image.imageResource.publicId
                ? this.cloudinaryService.destroyFile(image.imageResource.publicId)
                : Promise.resolve(),
            ),
          );

          // 2. Delete RestaurantImage first
          await manager.delete(
            RestaurantImage,
            restaurant.images.map(image => image.id),
          );

          // 3. Delete ImageResource
          await manager.delete(
            ImageResource,
            restaurant.images.map(image => image.imageResource.id),
          );
        }

        // 4. Finally delete the restaurant
        await manager.delete(Restaurant, { id: restaurant.id });
      });

      // After all database operations complete, delete the folder
      try {
        await this.cloudinaryService.destroyFolder(`${CLOUDINARY_FOLDERS.RESTAURANT_GALLERY}/${restaurant.slug}`);
      } catch (folderError) {
        console.warn(`Could not delete Cloudinary folder for restaurant ${restaurant.slug}:`, folderError);
        // Continue with the process, as the main deletion was successful
      }

      return { message: 'Restaurant deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting restaurant: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Upload images
  // ------------------------------------------------------------------------------------------------
  async uploadImages(id: string, files: Express.Multer.File[]) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: { images: { imageResource: true } },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    try {
      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: restaurant.name,
          preset: CloudinaryPresets.RESTAURANT_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.RESTAURANT_GALLERY}/${restaurant.slug}`,
        });

        if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

        // Create and save the image resource
        const imageResource = await this.restaurantRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: restaurant.name,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        await this.restaurantRepository.manager.save(ImageResource, imageResource);

        // Create and save the restaurant image association
        const restaurantImage = await this.restaurantRepository.manager.create(RestaurantImage, {
          imageResource,
          order: (restaurant.images?.length || 0) + index + 1,
          restaurant: { id: restaurant.id },
        });

        await this.restaurantRepository.manager.save(RestaurantImage, restaurantImage);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      return this.findOne(restaurant.id);
    } catch (error) {
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(id: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return restaurant.images?.sort((a, b) => a.order - b.order);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(id: string, imageId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const image = restaurant.images?.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.restaurantRepository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = restaurant.images
        ?.filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);
      if (remainingImages?.length) {
        await Promise.all(
          remainingImages.map((img, index) =>
            this.restaurantRepository.manager.update(RestaurantImage, img.id, {
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
    const restaurant = await this.restaurantRepository.findOne({ where: { id: identifier } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const { newOrder } = reorderImagesDto;
    await Promise.all(
      newOrder.map(({ id, order }) => this.restaurantRepository.manager.update(RestaurantImage, id, { order })),
    );

    return { message: 'Images reordered successfully' };
  }

  // ------------------------------------------------------------------------------------------------
  // Update user in lodging
  // ------------------------------------------------------------------------------------------------
  async updateUser(identifier: string, userId: string) {
    const restaurant = await this.restaurantRepository.findOne({ where: { id: identifier } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    restaurant.user = user;
    await this.restaurantRepository.save(restaurant);

    return user;
  }

  // ------------------------------------------------------------------------------------------------
  // Update visibility
  // ------------------------------------------------------------------------------------------------
  async updateVisibility(identifier: string, isPublic: boolean) {
    const restaurant = await this.restaurantRepository.findOne({ where: { id: identifier } });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    restaurant.isPublic = isPublic;
    await this.restaurantRepository.save(restaurant);
    return { message: 'Restaurant visibility updated', data: isPublic };
  }
}
