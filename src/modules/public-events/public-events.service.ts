import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { PublicEvent, PublicEventImage } from './entities';
import { CreatePublicEventDto, UpdatePublicEventDto, PublicEventFiltersDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { CloudinaryPresets } from 'src/config/cloudinary-presets.enum';
import { createSlug } from 'src/utils';
import { ImageResource } from '../core/entities';
import { ResourceProvider } from 'src/config/resource-provider.enum';
import { Town } from '../towns/entities';
import { User } from '../users/entities';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';

@Injectable()
export class PublicEventsService {
  constructor(
    @InjectRepository(PublicEvent)
    private readonly publicEventRepository: Repository<PublicEvent>,
    @InjectRepository(PublicEventImage)
    private readonly publicEventImageRepository: Repository<PublicEventImage>,
    @InjectRepository(ImageResource)
    private readonly imageResourceRepository: Repository<ImageResource>,
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    // Verify repositories are injected
    if (!this.publicEventRepository) {
      throw new Error('PublicEvent repository not injected');
    }
    if (!this.publicEventImageRepository) {
      throw new Error('PublicEventImage repository not injected');
    }
    if (!this.imageResourceRepository) {
      throw new Error('ImageResource repository not injected');
    }
    if (!this.townRepository) {
      throw new Error('Town repository not injected');
    }
    if (!this.userRepository) {
      throw new Error('User repository not injected');
    }
  }

  async create(createPublicEventDto: CreatePublicEventDto): Promise<PublicEvent> {
    const { townId, userId, googleMapsUrl, registrationLink, ...eventData } = createPublicEventDto;

    const town = await this.townRepository.findOne({ where: { id: townId } });
    if (!town) throw new NotFoundException(`Town with ID ${townId} not found`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const slug = createSlug(eventData.eventName);

    const event = new PublicEvent();
    Object.assign(event, {
      ...eventData,
      slug,
      town,
      user,
      googleMapsUrl: googleMapsUrl || null,
      registrationLink: registrationLink || null,
    });

    try {
      const savedEvent = await this.publicEventRepository.save(event);
      return savedEvent;
    } catch (error) {
      if (error.code === '23505' && error.detail.includes('slug')) {
        throw new ConflictException('An event with this name already exists');
      }
      throw error;
    }
  }

  async findAll(filters: PublicEventFiltersDto) {
    try {
      const {
        search,
        townId,
        userId,
        dateFrom,
        dateTo,
        priceMin,
        priceMax,
        isActive,
        page = 1,
        limit = 10,
        sortBy = 'startDate',
        sortOrder = 'ASC',
      } = filters;

      const query = this.publicEventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.town', 'town')
        .leftJoinAndSelect('event.user', 'user')
        .leftJoinAndSelect('event.images', 'images')
        .leftJoinAndSelect('images.imageResource', 'imageResource');

      if (userId) {
        query.andWhere('user.id = :userId', { userId });
      }

      if (townId) {
        query.andWhere('town.id = :townId', { townId });
      }

      if (isActive !== undefined) {
        query.andWhere('event.isActive = :isActive', { isActive });
      }

      if (dateFrom && dateTo) {
        query.andWhere('event.startDate BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
      } else if (dateFrom) {
        query.andWhere('event.startDate >= :dateFrom', { dateFrom });
      } else if (dateTo) {
        query.andWhere('event.startDate <= :dateTo', { dateTo });
      }

      if (priceMin !== undefined) {
        query.andWhere('event.price >= :priceMin', { priceMin });
      }

      if (priceMax !== undefined) {
        query.andWhere('event.price <= :priceMax', { priceMax });
      }

      if (search) {
        query.andWhere('(event.eventName ILIKE :search OR event.description ILIKE :search)', {
          search: `%${search}%`,
        });
      }

      // Apply sorting using entity property name
      query.orderBy(`event.${sortBy}`, sortOrder);

      // Apply pagination
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);

      const [events, total] = await query.getManyAndCount();

      // Sort images by displayOrder
      events.forEach(event => {
        if (event.images) {
          event.images.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }
      });

      return {
        data: events,
        meta: {
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  private snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  async findOne(id: string): Promise<PublicEvent> {
    const publicEvent = await this.publicEventRepository.findOne({
      where: { id },
      relations: ['town', 'user', 'images', 'images.imageResource'],
    });

    if (!publicEvent) {
      throw new NotFoundException(`Public event with ID ${id} not found`);
    }

    return publicEvent;
  }

  async findBySlug(slug: string): Promise<PublicEvent> {
    const publicEvent = await this.publicEventRepository.findOne({
      where: { slug },
      relations: ['town', 'user', 'images', 'images.imageResource'],
    });

    if (!publicEvent) {
      throw new NotFoundException(`Public event with slug ${slug} not found`);
    }

    return publicEvent;
  }

  async update(id: string, updatePublicEventDto: UpdatePublicEventDto): Promise<PublicEvent> {
    const { townId, googleMapsUrl, registrationLink, ...updateData } = updatePublicEventDto;

    const publicEvent = await this.findOne(id);
    if (!publicEvent) {
      throw new NotFoundException(`Public event with ID ${id} not found`);
    }

    if (townId) {
      const town = await this.townRepository.findOne({ where: { id: townId } });
      if (!town) {
        throw new NotFoundException(`Town with ID ${townId} not found`);
      }
      publicEvent.town = town;
    }

    Object.assign(publicEvent, {
      ...updateData,
      googleMapsUrl: googleMapsUrl === '' ? null : googleMapsUrl,
      registrationLink: registrationLink === '' ? null : registrationLink,
    });

    try {
      const savedEvent = await this.publicEventRepository.save(publicEvent);
      return savedEvent;
    } catch (error) {
      if (error.code === '23505' && error.detail.includes('slug')) {
        throw new ConflictException('An event with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const publicEvent = await this.findOne(id);

    try {
      // Delete everything in a single transaction
      await this.publicEventRepository.manager.transaction(async manager => {
        if (publicEvent.images && publicEvent.images.length > 0) {
          // 1. Delete images from Cloudinary
          await Promise.all(
            publicEvent.images.map(image =>
              image.imageResource.publicId
                ? this.cloudinaryService.destroyFile(image.imageResource.publicId)
                : Promise.resolve(),
            ),
          );

          // 2. Delete PublicEventImage entries first
          await manager.delete(
            PublicEventImage,
            publicEvent.images.map(image => image.id),
          );

          // 3. Delete ImageResource entries
          await manager.delete(
            ImageResource,
            publicEvent.images.map(image => image.imageResource.id),
          );
        }

        // 4. Finally delete the public event
        await manager.delete(PublicEvent, { id: publicEvent.id });
      });

      // After all database operations complete, delete the folder
      try {
        await this.cloudinaryService.destroyFolder(
          `${CLOUDINARY_FOLDERS.PUBLIC_EVENT_GALLERY}/${publicEvent.slug}`,
        );
      } catch (folderError) {
        console.warn(`Could not delete Cloudinary folder for public event ${publicEvent.slug}:`, folderError);
        // Continue with the process, as the main deletion was successful
      }
    } catch (error) {
      throw new BadRequestException(`Error deleting public event: ${error.message}`);
    }
  }

  async uploadImages(id: string, files: Express.Multer.File[], mediaFormat?: string, videoUrl?: string) {
    const publicEvent = await this.publicEventRepository.findOne({
      where: { id },
      relations: { images: { imageResource: true } },
    });

    if (!publicEvent) throw new NotFoundException('Public event not found');

    try {
      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: publicEvent.eventName,
          preset: CloudinaryPresets.LODGING_IMAGE,  // Usar el preset de lodgings como hacen las guías
          folder: `${CLOUDINARY_FOLDERS.PUBLIC_EVENT_GALLERY}/${publicEvent.slug}`,
        });

        if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

        // Create and save the image resource
        const imageResource = await this.publicEventRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: publicEvent.eventName,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        await this.publicEventRepository.manager.save(ImageResource, imageResource);

        // Create and save the public event image association
        const publicEventImage = await this.publicEventRepository.manager.create(PublicEventImage, {
          imageResource,
          displayOrder: (publicEvent.images?.length || 0) + index + 1,
          publicEvent: { id: publicEvent.id },
          mediaFormat: mediaFormat || 'image',
          videoUrl: videoUrl || undefined,
        });

        await this.publicEventRepository.manager.save(PublicEventImage, publicEventImage);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Return the updated public event
      return this.findOne(publicEvent.id);
    } catch (error) {
      throw error;
    }
  }

  async deleteImage(id: string, imageId: string): Promise<void> {
    const publicEvent = await this.publicEventRepository.findOne({
      where: { id },
      relations: ['images', 'images.imageResource'],
    });

    if (!publicEvent) {
      throw new NotFoundException(`Public event with ID ${id} not found`);
    }

    const image = await this.publicEventImageRepository.findOne({
      where: { id: imageId, publicEvent: { id } },
      relations: ['imageResource'],
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found for this event`);
    }

    try {
      // Delete from Cloudinary if exists
      if (image.imageResource?.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.publicEventImageRepository.remove(image);
    } catch (error) {
      throw new BadRequestException(`Error deleting image: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Reorder images
  // ------------------------------------------------------------------------------------------------
  async reorderImages(id: string, reorderImagesDto: ReorderImagesDto) {
    const publicEvent = await this.publicEventRepository.findOne({ where: { id } });
    if (!publicEvent) throw new NotFoundException('Public event not found');

    const { newOrder } = reorderImagesDto;
    console.log('Reordering images:', newOrder);

    try {
      await Promise.all(
        newOrder.map(({ id, order }) => this.publicEventRepository.manager.update(PublicEventImage, id, { displayOrder: order }))
      );

      return { message: 'Images reordered successfully' };
    } catch (error) {
      throw new BadRequestException('Error reordering images: ' + error.message);
    }
  }

  async setMainImage(eventId: string, imageId: string): Promise<void> {
    const publicEvent = await this.findOne(eventId);

    // This method relies on a dataSource, which is not injected in the constructor.
    // Assuming it's meant to be removed or refactored if this functionality is critical.
    // For now, commenting out the transaction as it's not available.
    // await this.dataSource.transaction(async manager => {
    //   // Remove main flag from all images
    //   await manager.update(
    //     PublicEventImage,
    //     { publicEvent: { id: eventId } },
    //     { isMain: false },
    //   );

    //   // Set new main image
    //   await manager.update(
    //     PublicEventImage,
    //     { id: imageId, publicEvent: { id: eventId } },
    //     { isMain: true },
    //   );
    // });
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(id: string) {
    const publicEvent = await this.publicEventRepository.findOne({
      where: { id },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!publicEvent) throw new NotFoundException('Public event not found');

    return publicEvent.images.sort((a, b) => a.displayOrder - b.displayOrder);
  }
}