import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LodgingRoomType, Lodging, LodgingRoomTypeImage } from './entities';
import { CreateLodgingRoomTypeDto, UpdateLodgingRoomTypeDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { ImageResource } from '../core/entities';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';

@Injectable()
export class LodgingRoomTypesService {
  private readonly logger = new Logger(LodgingRoomTypesService.name);

  constructor(
    @InjectRepository(LodgingRoomType)
    private readonly lodgingRoomTypeRepository: Repository<LodgingRoomType>,
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(LodgingRoomTypeImage)
    private readonly roomTypeImageRepository: Repository<LodgingRoomTypeImage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Create room type
  // ------------------------------------------------------------------------------------------------
  async create(lodgingId: string, createLodgingRoomTypeDto: CreateLodgingRoomTypeDto) {
    const lodging = await this.lodgingRepository.findOne({ where: { id: lodgingId } });

    if (!lodging) {
      throw new NotFoundException('Lodging not found');
    }

    try {
      const roomType = await this.lodgingRoomTypeRepository.save({
        ...createLodgingRoomTypeDto,
        lodging,
      });

      return roomType;
    } catch (error) {
      throw new BadRequestException(`Error creating room type: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Find all room types for a lodging
  // ------------------------------------------------------------------------------------------------
  async findByLodging(lodgingId: string) {
    return this.lodgingRoomTypeRepository.find({
      where: { lodging: { id: lodgingId }, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  // ------------------------------------------------------------------------------------------------
  // Find one room type
  // ------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const roomType = await this.lodgingRoomTypeRepository.findOne({
      where: { id, isActive: true },
      relations: ['lodging', 'images', 'images.imageResource'],
      order: { images: { order: 'ASC' } },
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    return roomType;
  }

  // ------------------------------------------------------------------------------------------------
  // Update room type
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateLodgingRoomTypeDto: UpdateLodgingRoomTypeDto) {
    await this.findOne(id); // Just validate existence

    try {
      await this.lodgingRoomTypeRepository.update(id, updateLodgingRoomTypeDto);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(`Error updating room type: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Soft delete room type
  // ------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const roomType = await this.findOne(id);

    try {
      await this.lodgingRoomTypeRepository.update(id, { isActive: false });
      return { message: `Room type ${roomType.name} has been deleted` };
    } catch (error) {
      throw new BadRequestException(`Error deleting room type: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Upload image
  // ------------------------------------------------------------------------------------------------
  async uploadImages(roomTypeId: string, files: Express.Multer.File[]) {
    this.logger.log(`Starting upload images for roomTypeId: ${roomTypeId}, files count: ${files?.length || 0}`);

    try {
      const roomType = await this.lodgingRoomTypeRepository.findOne({
        where: { id: roomTypeId },
        relations: { images: { imageResource: true }, lodging: true },
      });

      if (!roomType) {
        this.logger.error(`Room type not found for id: ${roomTypeId}`);
        throw new NotFoundException('Room type not found');
      }

      this.logger.log(
        `Found room type: ${roomType.name}, lodging: ${roomType.lodging?.name}, existing images: ${roomType.images?.length || 0}`,
      );

      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        this.logger.log(`Processing file ${index + 1}/${files.length}: ${file.originalname}`);

        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: `${roomType.lodging.name}-${roomType.name}`,
          preset: CloudinaryPresets.LODGING_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.LODGING_GALLERY}/${roomType.lodging.slug}/room-types/${roomType.id}`,
        });

        if (!cloudinaryRes) {
          this.logger.error(`Failed to upload to Cloudinary for file: ${file.originalname}`);
          throw new BadRequestException('Error uploading image to Cloudinary');
        }

        this.logger.log(`Cloudinary upload successful for ${file.originalname}: ${cloudinaryRes.publicId}`);

        // Create and save the image resource
        const imageResource = this.lodgingRoomTypeRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: `${roomType.lodging.name}-${roomType.name}`,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        const savedImageResource = await this.lodgingRoomTypeRepository.manager.save(ImageResource, imageResource);
        this.logger.log(`Image resource saved with ID: ${savedImageResource.id}`);

        // Create and save the room type image association
        const roomTypeImage = this.lodgingRoomTypeRepository.manager.create(LodgingRoomTypeImage, {
          imageResource: savedImageResource,
          order: roomType.images.length + index + 1,
          roomType: { id: roomType.id },
        });

        const savedRoomTypeImage = await this.lodgingRoomTypeRepository.manager.save(
          LodgingRoomTypeImage,
          roomTypeImage,
        );
        this.logger.log(`Room type image association saved with ID: ${savedRoomTypeImage.id}`);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      this.logger.log(`All ${files.length} images uploaded successfully`);
      return this.findOne(roomType.id);
    } catch (error) {
      this.logger.error(`Error uploading images for roomTypeId ${roomTypeId}:`, error.stack || error.message);
      throw new BadRequestException(`Error uploading images: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(roomTypeId: string) {
    this.logger.log(`Getting images for roomTypeId: ${roomTypeId}`);

    try {
      const roomType = await this.lodgingRoomTypeRepository.findOne({
        where: { id: roomTypeId },
        relations: {
          images: {
            imageResource: true,
          },
        },
      });

      if (!roomType) {
        this.logger.error(`Room type not found for id: ${roomTypeId}`);
        throw new NotFoundException('Room type not found');
      }

      this.logger.log(`Found room type: ${roomType.name}, images count: ${roomType.images?.length || 0}`);

      const sortedImages = roomType.images.sort((a, b) => a.order - b.order);
      this.logger.log(`Returning ${sortedImages.length} sorted images`);

      return sortedImages;
    } catch (error) {
      this.logger.error(`Error getting images for roomTypeId ${roomTypeId}:`, error.stack || error.message);
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(roomTypeId: string, imageId: string) {
    const roomType = await this.lodgingRoomTypeRepository.findOne({
      where: { id: roomTypeId },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!roomType) throw new NotFoundException('Room type not found');

    const image = roomType.images.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.lodgingRoomTypeRepository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = roomType.images
        .filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);

      await Promise.all(
        remainingImages.map((img, index) =>
          this.lodgingRoomTypeRepository.manager.update(LodgingRoomTypeImage, img.id, {
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
  async reorderImages(roomTypeId: string, reorderDto: ReorderImagesDto) {
    const roomType = await this.lodgingRoomTypeRepository.findOne({
      where: { id: roomTypeId },
      relations: { images: true },
    });

    if (!roomType) throw new NotFoundException('Room type not found');

    try {
      const updatePromises = reorderDto.newOrder.map(({ id, order }) =>
        this.roomTypeImageRepository.update(id, { order }),
      );

      await Promise.all(updatePromises);

      return { message: 'Images reordered successfully' };
    } catch (error) {
      throw new BadRequestException('Error reordering images: ' + error.message);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Hard delete room type
  // ------------------------------------------------------------------------------------------------
  async delete(id: string) {
    const roomType = await this.lodgingRoomTypeRepository.findOne({
      where: { id },
      relations: ['images', 'images.imageResource'],
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    try {
      // Delete images from Cloudinary first
      if (roomType.images && roomType.images.length > 0) {
        const deletePromises = roomType.images.map(async image => {
          if (image.imageResource.publicId) {
            await this.cloudinaryService.destroyFile(image.imageResource.publicId);
          }
        });
        await Promise.all(deletePromises);
      }

      // Hard delete the room type (this will cascade delete images due to foreign key)
      await this.lodgingRoomTypeRepository.remove(roomType);

      return { message: `Room type ${roomType.name} has been permanently deleted` };
    } catch (error) {
      throw new BadRequestException(`Error permanently deleting room type: ${error.message}`);
    }
  }
}
