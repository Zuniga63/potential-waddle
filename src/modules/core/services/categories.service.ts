import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, Model, AppIcon, ImageResource } from '../entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import { AdminCategoriesFiltersDto, AdminCategoriesListDto } from '../dto/categories';
import { ModelsEnum } from '../enums';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
    @InjectRepository(AppIcon)
    private readonly appIconsRepository: Repository<AppIcon>,
    @InjectRepository(ImageResource)
    private readonly imageResourceRepository: Repository<ImageResource>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  async create(createCategoryDto: CreateCategoryDto) {
    const { models: modelsDto, iconId, ...res } = createCategoryDto;
    const category = this.categoriesRepository.create(res);

    if (modelsDto && modelsDto.length) {
      const models = await this.modelsRepository.findBy({ id: In(modelsDto) });
      category.models = models;
    }

    if (iconId) {
      const icon = await this.appIconsRepository.findOne({ where: { id: iconId } });
      if (icon) {
        category.icon = icon;
      }
    }

    return this.categoriesRepository.save(category);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  async findAll({
    model,
    onlyEnabled = true,
    onlyAsigned = false,
  }: { model?: ModelsEnum; onlyEnabled?: boolean; onlyAsigned?: boolean } = {}) {
    let where: FindOptionsWhere<Category> | FindOptionsWhere<Category>[] = { isEnabled: onlyEnabled };

    const order: FindOptionsOrder<Category> = { name: 'ASC' };

    const relations: FindOptionsRelations<Category> = { icon: true, models: true, imageResource: true };
    const select: FindOptionsSelect<Category> = { models: { id: true, name: true } };

    if (!model) {
      if (onlyAsigned) {
        where = [
          { ...where, places: { id: Not(IsNull()) } },
          { ...where, restaurants: { id: Not(IsNull()) } },
          { ...where, lodgings: { id: Not(IsNull()) } },
          { ...where, experiences: { id: Not(IsNull()) } },
          { ...where, commerces: { id: Not(IsNull()) } },
          { ...where, guides: { id: Not(IsNull()) } },
        ];
      }

      return this.categoriesRepository.find({ where, order, relations, select });
    }

    relations.models = false;

    const modelWhere: FindOptionsWhere<Category> = { ...where, models: { slug: model } };
    const withoutModelWhere: FindOptionsWhere<Category> = { ...where, models: { id: IsNull() } };
    if (onlyAsigned) {
      modelWhere.models = {};
      if (model === ModelsEnum.Places) {
        modelWhere.places = { id: Not(IsNull()) };
      }
      if (model === ModelsEnum.Restaurants) {
        modelWhere.restaurants = { id: Not(IsNull()) };
      }
      if (model === ModelsEnum.Lodgings) {
        modelWhere.lodgings = { id: Not(IsNull()) };
      }
      if (model === ModelsEnum.Experiences) {
        modelWhere.experiences = { id: Not(IsNull()) };
      }
      if (model === ModelsEnum.Transports) {
        modelWhere.transports = { id: Not(IsNull()) };
      }
      if (model === ModelsEnum.Commerce) {
        modelWhere.commerces = { id: Not(IsNull()) };
      }
      if (model === ModelsEnum.Guides) {
        modelWhere.guides = { id: Not(IsNull()) };
      }
    }

    const [modelCategories, categoriesWithoutModel] = await Promise.all([
      this.categoriesRepository.find({ where: modelWhere, order, relations, select }),
      this.categoriesRepository.find({ where: withoutModelWhere, order, relations, select }),
    ]);

    return [...modelCategories, ...categoriesWithoutModel].sort((a, b) => a.name.localeCompare(b.name));
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL CATEGORIES (FULL)
  // * -------------------------------------------------------------------------------------------------------------
  async findAllFull() {
    const order: FindOptionsOrder<Category> = { name: 'ASC' };
    const relations: FindOptionsRelations<Category> = {
      icon: true,
      imageResource: true,
      models: true,
      places: true,
      restaurants: true,
      lodgings: true,
      experiences: true,
      commerces: true,
      guides: true,
      transports: true,
    };
    const select: FindOptionsSelect<Category> = {
      models: { id: true, name: true, slug: true },
      places: { id: true },
      restaurants: { id: true },
      lodgings: { id: true },
      experiences: { id: true },
      commerces: { id: true },
      guides: { id: true },
      transports: { id: true },
    };

    return this.categoriesRepository.find({
      order,
      relations,
      select,
    });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL CATEGORIES (PAGINATED - ADMIN)
  // * -------------------------------------------------------------------------------------------------------------
  async findAllPaginated(filters: AdminCategoriesFiltersDto): Promise<AdminCategoriesListDto> {
    const { page = 1, limit = 10, search, model, sortBy = 'name', sortOrder = 'ASC' } = filters;

    const where: FindOptionsWhere<Category> = {};

    // Search by name
    if (search) {
      where.name = ILike(`%${search}%`);
    }

    // Filter by model
    if (model) {
      where.models = { slug: model };
    }

    // Build order
    const order: FindOptionsOrder<Category> = {};
    if (sortBy === 'name') {
      order.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      order.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      order.updatedAt = sortOrder;
    } else {
      order.name = sortOrder;
    }

    const relations: FindOptionsRelations<Category> = {
      icon: true,
      imageResource: true,
      models: true,
      places: true,
      restaurants: true,
      lodgings: true,
      experiences: true,
      commerces: true,
      guides: true,
      transports: true,
    };

    const select: FindOptionsSelect<Category> = {
      models: { id: true, name: true, slug: true },
      places: { id: true },
      restaurants: { id: true },
      lodgings: { id: true },
      experiences: { id: true },
      commerces: { id: true },
      guides: { id: true },
      transports: { id: true },
    };

    const [categories, count] = await this.categoriesRepository.findAndCount({
      where,
      order,
      relations,
      select,
      skip: (page - 1) * limit,
      take: limit,
    });

    const pages = Math.ceil(count / limit);

    return new AdminCategoriesListDto({ currentPage: page, pages, count }, categories);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET CATEGORY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { icon: true, models: true, imageResource: true },
      select: { models: { id: true, name: true, slug: true } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { models: modelsDto, iconId, ...res } = updateCategoryDto;

    // Verificar que la categoría existe
    const existingCategory = await this.categoriesRepository.findOne({
      where: { id },
      relations: { models: true, icon: true, imageResource: true },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Si se proporcionan modelos, buscarlos en la base de datos
    let models: Model[] = [];
    if (modelsDto && modelsDto.length > 0) {
      models = await this.modelsRepository.findBy({ id: In(modelsDto) });
    }

    // Handle icon update
    if (iconId !== undefined) {
      if (iconId) {
        const icon = await this.appIconsRepository.findOne({ where: { id: iconId } });
        if (!icon) {
          throw new NotFoundException('Icon not found');
        }
        existingCategory.icon = icon;
      } else {
        existingCategory.icon = undefined;
      }
    }

    // Update basic fields
    Object.assign(existingCategory, res);

    // Update models if provided
    if (modelsDto !== undefined) {
      existingCategory.models = models;
    }

    // Actualizar la categoría
    const updatedCategory = await this.categoriesRepository.save(existingCategory);

    // Retornar la categoría actualizada con sus relaciones
    return this.categoriesRepository.findOne({
      where: { id: updatedCategory.id },
      relations: { icon: true, models: true, imageResource: true },
      select: { models: { id: true, name: true, slug: true } },
    });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  async remove(id: string) {
    // Verificar que la categoría existe
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: {
        places: true,
        restaurants: true,
        lodgings: true,
        experiences: true,
        commerces: true,
        guides: true,
        transports: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verificar si la categoría tiene relaciones activas
    const hasRelations =
      (category.places && category.places.length > 0) ||
      (category.restaurants && category.restaurants.length > 0) ||
      (category.lodgings && category.lodgings.length > 0) ||
      (category.experiences && category.experiences.length > 0) ||
      (category.commerces && category.commerces.length > 0) ||
      (category.guides && category.guides.length > 0) ||
      (category.transports && category.transports.length > 0);

    if (hasRelations) {
      throw new ConflictException(
        'Cannot delete category with active relationships. Please remove all associated items first.',
      );
    }

    // Eliminar la categoría
    await this.categoriesRepository.remove(category);

    return { message: `Category "${category.name}" has been successfully deleted` };
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPLOAD CATEGORY IMAGE
  // * -------------------------------------------------------------------------------------------------------------
  async uploadImage(id: string, file: Express.Multer.File) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { imageResource: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Delete old image from Cloudinary if exists
    if (category.imageResource?.publicId) {
      await this.cloudinaryService.destroyFile(category.imageResource.publicId);
    }

    // Upload new image to Cloudinary
    const cloudinaryRes = await this.cloudinaryService.uploadImage({
      file,
      fileName: `category-${category.slug}`,
      preset: CloudinaryPresets.DEFAULT,
      folder: CLOUDINARY_FOLDERS.CATEGORY_IMAGES,
    });

    if (!cloudinaryRes) {
      throw new BadRequestException('Error uploading image to Cloudinary');
    }

    // Create or update image resource
    let imageResource: ImageResource;
    if (category.imageResource) {
      // Update existing image resource
      category.imageResource.url = cloudinaryRes.url;
      category.imageResource.publicId = cloudinaryRes.publicId;
      category.imageResource.width = cloudinaryRes.width;
      category.imageResource.height = cloudinaryRes.height;
      category.imageResource.format = cloudinaryRes.format;
      category.imageResource.resourceType = cloudinaryRes.type;
      imageResource = await this.imageResourceRepository.save(category.imageResource);
    } else {
      // Create new image resource
      imageResource = this.imageResourceRepository.create({
        url: cloudinaryRes.url,
        publicId: cloudinaryRes.publicId,
        fileName: `category-${category.slug}`,
        width: cloudinaryRes.width,
        height: cloudinaryRes.height,
        format: cloudinaryRes.format,
        resourceType: cloudinaryRes.type,
        provider: ResourceProvider.Cloudinary,
      });
      imageResource = await this.imageResourceRepository.save(imageResource);
    }

    // Update category with new image resource
    category.imageResource = imageResource;
    await this.categoriesRepository.save(category);

    return this.findOne(id);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE CATEGORY IMAGE
  // * -------------------------------------------------------------------------------------------------------------
  async deleteImage(id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { imageResource: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.imageResource) {
      throw new NotFoundException('Category does not have an image');
    }

    // Delete from Cloudinary
    if (category.imageResource.publicId) {
      await this.cloudinaryService.destroyFile(category.imageResource.publicId);
    }

    // Remove image resource reference from category
    const imageResourceId = category.imageResource.id;
    category.imageResource = undefined as any;
    await this.categoriesRepository.save(category);

    // Delete image resource
    await this.imageResourceRepository.delete(imageResourceId);

    return { message: 'Category image deleted successfully' };
  }
}
