import { FindOptionsRelations, In, Point, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';

import { CreateExperienceDto, ExperienceDto, UpdateExperienceDto } from './dto';
import { Experience, ExperienceImage } from './entities';
import type { ExperienceFindAllParams } from './interfaces';
import { generateExperienceQueryFiltersAndSort } from './logic';
import { Facility, ImageResource } from '../core/entities';
import { Category } from '../core/entities';
import { Town } from '../towns/entities';
import { Guide } from '../guides/entities/guide.entity';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets } from 'src/config/cloudinary-presets.enum';
import { ResourceProvider } from 'src/config/resource-provider.enum';
import { ExperienceIndexDto } from './dto/experience-index.dto';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,

    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,

    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Find all experiences
  // ------------------------------------------------------------------------------------------------
  async findAll({ filters }: ExperienceFindAllParams = {}): Promise<ExperienceDto[]> {
    const { where, order } = generateExperienceQueryFiltersAndSort(filters);
    const experiences = await this.experienceRepository.find({
      relations: {
        categories: { icon: true },
        images: { imageResource: true },
        town: { department: true },
        guide: true,
      },
      order,
      where,
    });

    return experiences.map(experience => new ExperienceIndexDto({ data: experience }));
  }

  // ------------------------------------------------------------------------------------------------
  // Find public experiences
  // ------------------------------------------------------------------------------------------------
  async findPublicExperiences({ filters }: ExperienceFindAllParams = {}): Promise<ExperienceDto[]> {
    const shouldRandomize = filters?.sortBy === 'random';
    const { where, order } = generateExperienceQueryFiltersAndSort(filters);
    let experiences = await this.experienceRepository.find({
      relations: {
        categories: { icon: true },
        images: { imageResource: true },
        town: { department: true },
        guide: true,
      },
      order,
      where: {
        ...where,
        isPublic: true,
      },
    });

    if (shouldRandomize) {
      experiences = experiences.sort(() => Math.random() - 0.5);
    }
    return experiences.map(experience => new ExperienceIndexDto({ data: experience }));
  }

  // ------------------------------------------------------------------------------------------------
  // ------------------------------------------------------------------------------------------------
  // Find one experience by identifier
  // ------------------------------------------------------------------------------------------------
  async findOne(identifier: string) {
    const experience = await this.experienceRepository.findOne({
      where: { id: identifier },
      relations: {
        categories: { icon: true },
        facilities: true,
        images: { imageResource: true },
        town: { department: true },
        guide: { user: true },
      },
      order: { images: { order: 'ASC' } },
    });

    if (!experience) throw new NotImplementedException('Experience not found');
    return new ExperienceDto({ data: experience });
  }

  // ------------------------------------------------------------------------------------------------
  // Find one lodging by slug
  // ------------------------------------------------------------------------------------------------
  async findOneBySlug({ slug }: { slug: string }) {
    const relations: FindOptionsRelations<Experience> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
      guide: { user: true },
    };

    let experience = await this.experienceRepository.findOne({
      where: { slug },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!experience) experience = await this.experienceRepository.findOne({ where: { slug }, relations });
    if (!experience) throw new NotFoundException('Experience not found');

    return new ExperienceDto({ data: experience });
  }

  // ------------------------------------------------------------------------------------------------
  // Create experience
  // ------------------------------------------------------------------------------------------------
  async create(createExperienceDto: CreateExperienceDto) {
    const { departure, arrival, ...restCreateDto } = createExperienceDto;
    const arrivalLocation: Point | null =
      arrival.latitude && arrival.longitude
        ? {
            type: 'Point',
            coordinates: [arrival.longitude, arrival.latitude],
          }
        : null;

    const departureLocation: Point | null =
      departure.latitude && departure.longitude
        ? {
            type: 'Point',
            coordinates: [departure.longitude, departure.latitude],
          }
        : null;

    const departureDescription = departure.description;
    const arrivalDescription = arrival.description;

    const categories = createExperienceDto.categoryIds
      ? await this.categoryRepository.findBy({ id: In(createExperienceDto.categoryIds) })
      : [];
    const facilities = createExperienceDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(createExperienceDto.facilityIds) })
      : [];
    const town = await this.townRepository.findOne({ where: { id: createExperienceDto.townId } });
    const guide = await this.guideRepository.findOne({ where: { id: createExperienceDto.guideId } });

    if (!town) {
      throw new NotFoundException('Town not found');
    }
    try {
      await this.experienceRepository.save({
        ...restCreateDto,
        departureLocation: departureLocation ?? undefined,
        arrivalLocation: arrivalLocation ?? undefined,
        departureDescription,
        arrivalDescription,
        categories,
        facilities,
        town: town ?? undefined,
        guide: guide ?? undefined,
      });

      return { message: restCreateDto.title };
    } catch (error) {
      throw new BadRequestException(`Error creating experience: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Update lodging
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateExperienceDto: UpdateExperienceDto) {
    const experience = await this.experienceRepository.findOne({ where: { id } });
    const guide = await this.guideRepository.findOne({ where: { id: updateExperienceDto?.guideId } });
    const categories = updateExperienceDto.categoryIds
      ? await this.categoryRepository.findBy({ id: In(updateExperienceDto.categoryIds) })
      : [];
    const facilities = updateExperienceDto.facilityIds
      ? await this.facilityRepository.findBy({ id: In(updateExperienceDto.facilityIds) })
      : [];
    if (!experience) throw new NotFoundException('Experience not found');

    // Extraer lat y lng del DTO y crear el Point
    const { departure, arrival, ...restUpdateDto } = updateExperienceDto;
    const departureLocation: Point | null =
      departure?.latitude && departure.longitude
        ? {
            type: 'Point',
            coordinates: [departure.longitude, departure.latitude], // GeoJSON usa [longitude, latitude]
          }
        : null;

    const arrivalLocation: Point | null =
      arrival?.latitude && arrival.longitude
        ? {
            type: 'Point',
            coordinates: [arrival.longitude, arrival.latitude], // GeoJSON usa [longitude, latitude]
          }
        : null;

    const departureDescription = departure?.description;
    const arrivalDescription = arrival?.description;

    await this.experienceRepository.save({
      id: experience.id,
      ...restUpdateDto,
      arrivalLocation: arrivalLocation ?? undefined,
      departureLocation: departureLocation ?? undefined,
      departureDescription,
      arrivalDescription,
      categories,
      guide: guide ?? undefined,
      facilities,
    });

    const relations: FindOptionsRelations<Experience> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
      guide: { user: true },
    };

    const updatedExperience = await this.experienceRepository.findOne({
      where: { id },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!updatedExperience) throw new NotFoundException('Experience not found');
    return { message: updatedExperience.title };
    // return new ExperienceDto({ data: updatedExperience });
  }

  // ------------------------------------------------------------------------------------------------
  // Delete lodging
  // ------------------------------------------------------------------------------------------------
  async delete(id: string) {
    const experience = await this.experienceRepository.findOne({
      where: { id },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!experience) throw new NotFoundException('Experience not found');

    try {
      // Eliminar todo en una única transacción
      await this.experienceRepository.manager.transaction(async manager => {
        if (experience.images && experience.images.length > 0) {
          // 1. Eliminar imágenes de Cloudinary
          await Promise.all(
            experience.images.map(image =>
              image.imageResource.publicId
                ? this.cloudinaryService.destroyFile(image.imageResource.publicId)
                : Promise.resolve(),
            ),
          );

          // 2. Eliminar las ExperienceImage primero
          await manager.delete(
            ExperienceImage,
            experience.images.map(image => image.id),
          );

          // 3. Eliminar los ImageResource
          await manager.delete(
            ImageResource,
            experience.images.map(image => image.imageResource.id),
          );
        }

        // 4. Finalmente eliminar la experiencia
        await manager.delete(Experience, { id: experience.id });
      });

      // Después de que todas las operaciones de base de datos se completen, eliminar la carpeta
      try {
        await this.cloudinaryService.destroyFolder(`${CLOUDINARY_FOLDERS.EXPERIENCE_GALLERY}/${experience.slug}`);
      } catch (folderError) {
        console.warn(`Could not delete Cloudinary folder for experience ${experience.slug}:`, folderError);
        // Continuar con el proceso, ya que la eliminación principal fue exitosa
      }

      return { message: 'Experience deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Error deleting experience: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Upload image
  // ------------------------------------------------------------------------------------------------
  async uploadImages(id: string, files: Express.Multer.File[]) {
    const experience = await this.experienceRepository.findOne({
      where: { id },
      relations: { images: { imageResource: true } },
    });

    if (!experience) throw new NotFoundException('Experience not found');

    try {
      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: experience.title,
          preset: CloudinaryPresets.LODGING_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.EXPERIENCE_GALLERY}/${experience.slug}`,
        });

        if (!cloudinaryRes) throw new BadRequestException('Error uploading image');

        // Create and save the image resource
        const imageResource = await this.experienceRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: experience.title,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        await this.experienceRepository.manager.save(ImageResource, imageResource);

        // Create and save the experience image association
        const experienceImage = await this.experienceRepository.manager.create(ExperienceImage, {
          imageResource,
          order: experience.images.length + index + 1,
          experience: { id: experience.id },
        });

        await this.experienceRepository.manager.save(ExperienceImage, experienceImage);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      return this.findOne(experience.id);
    } catch (error) {
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(id: string) {
    const experience = await this.experienceRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });
    console.log('images', experience?.images.length);

    if (!experience) throw new NotFoundException('Experience not found');

    return experience.images.sort((a, b) => a.order - b.order);
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(id: string, imageId: string) {
    const experience = await this.experienceRepository.findOne({
      where: [{ id }],
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!experience) throw new NotFoundException('Experience not found');

    const image = experience.images.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.experienceRepository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = experience.images
        .filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);

      await Promise.all(
        remainingImages.map((img, index) =>
          this.experienceRepository.manager.update(ExperienceImage, img.id, {
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
    const experience = await this.experienceRepository.findOne({ where: { id: identifier } });
    if (!experience) throw new NotFoundException('Experience not found');

    const { newOrder } = reorderImagesDto;
    console.log(newOrder);
    await Promise.all(
      newOrder.map(({ id, order }) => this.experienceRepository.manager.update(ExperienceImage, id, { order })),
    );

    return { message: 'Images reordered successfully' };
  }

  // ------------------------------------------------------------------------------------------------
  // Update user in lodging
  // ------------------------------------------------------------------------------------------------
  async updateGuide(identifier: string, guideId: string) {
    const experience = await this.experienceRepository.findOne({ where: { id: identifier } });
    if (!experience) throw new NotFoundException('Experience not found');

    const guide = await this.guideRepository.findOne({ where: { id: guideId } });
    if (!guide) throw new NotFoundException('Guide not found');
    experience.guide = guide;
    await this.experienceRepository.save(experience);

    return guide;
  }

  async updateVisibility(identifier: string, isPublic: boolean) {
    const experience = await this.experienceRepository.findOne({ where: { id: identifier } });

    if (!experience) {
      throw new NotFoundException('Experience not found');
    }
    experience.isPublic = isPublic;
    await this.experienceRepository.save(experience);
    return { message: 'Experience visibility updated', data: isPublic };
  }
}
