import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Town, TownImage } from '../entities';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { ImageResource } from 'src/modules/core/entities';
import { UpdateTownImageDto, SetHeroImagesDto, TownImageDto } from '../dto';
import { ReorderImagesDto } from 'src/modules/common/dto/reoder-images.dto';

@Injectable()
export class TownImagesService {
  constructor(
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    @InjectRepository(TownImage)
    private readonly townImageRepository: Repository<TownImage>,
    @InjectRepository(ImageResource)
    private readonly imageResourceRepository: Repository<ImageResource>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Get town with images
  // ------------------------------------------------------------------------------------------------
  async getTownWithImages(townId: string): Promise<Town> {
    const town = await this.townRepository.findOne({
      where: { id: townId },
      relations: { images: { imageResource: true } },
    });

    if (!town) throw new NotFoundException('Town not found');
    return town;
  }

  // ------------------------------------------------------------------------------------------------
  // Get images for a town
  // ------------------------------------------------------------------------------------------------
  async getImages(townId: string): Promise<TownImageDto[]> {
    const town = await this.getTownWithImages(townId);
    const images = town.images || [];
    return images
      .sort((a, b) => a.order - b.order)
      .map(img => new TownImageDto(img));
  }

  // ------------------------------------------------------------------------------------------------
  // Upload images
  // ------------------------------------------------------------------------------------------------
  async uploadImages(townId: string, files: Express.Multer.File[]): Promise<TownImageDto[]> {
    const town = await this.getTownWithImages(townId);
    const existingImages = town.images || [];

    const currentMaxOrder = existingImages.length > 0
      ? Math.max(...existingImages.map(img => img.order))
      : 0;

    const uploadedImages: TownImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Upload the image to Cloudinary
      const cloudinaryRes = await this.cloudinaryService.uploadImage({
        file,
        fileName: town.name,
        preset: CloudinaryPresets.TOWN_IMAGE,
        folder: `${CLOUDINARY_FOLDERS.TOWN_GALLERY}/${town.slug}`,
      });

      if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

      // Create and save the image resource
      const imageResource = this.imageResourceRepository.create({
        publicId: cloudinaryRes.publicId,
        url: cloudinaryRes.url,
        fileName: town.name,
        width: cloudinaryRes.width,
        height: cloudinaryRes.height,
        format: cloudinaryRes.format,
        resourceType: cloudinaryRes.type,
        provider: ResourceProvider.Cloudinary,
      });

      await this.imageResourceRepository.save(imageResource);

      // Create and save the town image association
      const townImage = this.townImageRepository.create({
        imageResource,
        order: currentMaxOrder + i + 1,
        town: { id: town.id },
        isHero: false,
        isPublic: true,
      });

      await this.townImageRepository.save(townImage);
      uploadedImages.push(townImage);
    }

    // Reload to get full imageResource data
    const savedImages = await this.townImageRepository.find({
      where: uploadedImages.map(img => ({ id: img.id })),
      relations: { imageResource: true },
    });

    return savedImages.map(img => new TownImageDto(img));
  }

  // ------------------------------------------------------------------------------------------------
  // Update image
  // ------------------------------------------------------------------------------------------------
  async updateImage(townId: string, imageId: string, dto: UpdateTownImageDto): Promise<TownImageDto> {
    const town = await this.getTownWithImages(townId);
    const images = town.images || [];
    const image = images.find(img => img.id === imageId);

    if (!image) throw new NotFoundException('Image not found');

    // If setting as hero, validate max 3 hero images
    if (dto.isHero === true) {
      const currentHeroCount = images.filter(img => img.isHero && img.id !== imageId).length;
      if (currentHeroCount >= 3) {
        throw new BadRequestException('Maximum 3 hero images allowed');
      }
    }

    // If setting heroPosition, ensure it's not already taken
    if (dto.heroPosition) {
      const existingWithPosition = images.find(
        img => img.heroPosition === dto.heroPosition && img.id !== imageId,
      );
      if (existingWithPosition) {
        // Swap positions
        existingWithPosition.heroPosition = image.heroPosition;
        await this.townImageRepository.save(existingWithPosition);
      }
    }

    // Update the image
    Object.assign(image, dto);
    await this.townImageRepository.save(image);

    return new TownImageDto(image);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(townId: string, imageId: string): Promise<{ message: string }> {
    const town = await this.getTownWithImages(townId);
    const images = town.images || [];
    const image = images.find(img => img.id === imageId);

    if (!image) throw new NotFoundException('Image not found');

    // Delete from Cloudinary
    if (image.imageResource?.publicId) {
      await this.cloudinaryService.destroyFile(image.imageResource.publicId);
    }

    // Delete from database
    await this.townImageRepository.remove(image);

    // Optionally delete the ImageResource if not used elsewhere
    if (image.imageResource) {
      await this.imageResourceRepository.remove(image.imageResource);
    }

    // Reorder remaining images
    const remainingImages = images
      .filter(img => img.id !== imageId)
      .sort((a, b) => a.order - b.order);

    await Promise.all(
      remainingImages.map((img, index) =>
        this.townImageRepository.update(img.id, { order: index + 1 }),
      ),
    );

    return { message: 'Image deleted successfully' };
  }

  // ------------------------------------------------------------------------------------------------
  // Reorder images
  // ------------------------------------------------------------------------------------------------
  async reorderImages(townId: string, dto: ReorderImagesDto): Promise<{ message: string }> {
    const town = await this.townRepository.findOne({ where: { id: townId } });
    if (!town) throw new NotFoundException('Town not found');

    await Promise.all(
      dto.newOrder.map(({ id, order }) =>
        this.townImageRepository.update(id, { order }),
      ),
    );

    return { message: 'Images reordered successfully' };
  }

  // ------------------------------------------------------------------------------------------------
  // Set hero images
  // ------------------------------------------------------------------------------------------------
  async setHeroImages(townId: string, dto: SetHeroImagesDto): Promise<TownImageDto[]> {
    const town = await this.getTownWithImages(townId);

    if (dto.imageIds.length > 3) {
      throw new BadRequestException('Maximum 3 hero images allowed');
    }

    // Reset all hero flags
    await this.townImageRepository
      .createQueryBuilder()
      .update(TownImage)
      .set({ isHero: false, heroPosition: undefined })
      .where('town_id = :townId', { townId })
      .execute();

    // Set new hero images with positions
    for (let i = 0; i < dto.imageIds.length; i++) {
      const imageId = dto.imageIds[i];
      await this.townImageRepository.update(imageId, {
        isHero: true,
        heroPosition: i + 1,
      });
    }

    // Return updated images
    return this.getImages(townId);
  }

  // ------------------------------------------------------------------------------------------------
  // Get hero images
  // ------------------------------------------------------------------------------------------------
  async getHeroImages(townId: string): Promise<TownImageDto[]> {
    const images = await this.townImageRepository.find({
      where: { town: { id: townId }, isHero: true },
      relations: { imageResource: true },
      order: { heroPosition: 'ASC' },
    });

    return images.map(img => new TownImageDto(img));
  }

  // ------------------------------------------------------------------------------------------------
  // Get public hero data (images + slogan) by slug or name
  // ------------------------------------------------------------------------------------------------
  async getPublicHeroData(slugOrName: string): Promise<{
    name?: string;
    slogan?: string;
    department?: string;
    images: { url: string; position: number }[];
  }> {
    // Try to find by slug first, then by name
    let town = await this.townRepository.findOne({
      where: { slug: slugOrName },
      relations: { images: { imageResource: true }, department: true },
    });

    if (!town) {
      town = await this.townRepository.findOne({
        where: { name: slugOrName },
        relations: { images: { imageResource: true }, department: true },
      });
    }

    if (!town) {
      return { images: [] };
    }

    const heroImages = town.images
      ?.filter(img => img.isHero && img.isPublic)
      .sort((a, b) => (a.heroPosition || 0) - (b.heroPosition || 0))
      .map(img => ({
        url: img.imageResource?.url || '',
        position: img.heroPosition || 0,
      })) || [];

    return {
      name: town.name,
      slogan: town.slogan,
      department: town.department?.name,
      images: heroImages,
    };
  }

  // ------------------------------------------------------------------------------------------------
  // Get public town info data by slug or name
  // ------------------------------------------------------------------------------------------------
  async getPublicTownInfo(slugOrName: string): Promise<{
    name: string;
    ubication?: string;
    population?: number;
    temperature?: number;
    distanceToCapital?: string;
    altitude?: number;
  } | null> {
    // Try to find by slug first, then by name
    let town = await this.townRepository.findOne({
      where: { slug: slugOrName },
      relations: { info: true },
    });

    if (!town) {
      town = await this.townRepository.findOne({
        where: { name: slugOrName },
        relations: { info: true },
      });
    }

    if (!town) {
      return null;
    }

    return {
      name: town.name,
      ubication: town.info?.ubication,
      population: town.info?.population,
      temperature: town.info?.temperature,
      distanceToCapital: town.info?.distanceToCapital,
      altitude: town.info?.altitude,
    };
  }
}
