import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, Model } from '../entities';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { CreateCategoryDto } from '../dto';
import { ModelsEnum } from '../enums';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  async create(createCategoryDto: CreateCategoryDto) {
    const { models: modelsDto, ...res } = createCategoryDto;
    const category = this.categoriesRepository.create(res);

    if (modelsDto && modelsDto.length) {
      const models = await this.modelsRepository.findBy({ id: In(modelsDto) });
      category.models = models;
    }

    return this.categoriesRepository.save(category);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  async findAll({ modelId, innerJoin }: { modelId?: string; innerJoin?: ModelsEnum } = {}) {
    const where: FindOptionsWhere<Category> = { isEnabled: true };
    const order: FindOptionsOrder<Category> = { name: 'ASC' };
    const relations: FindOptionsRelations<Category> = { icon: true };

    if (innerJoin) {
      if (innerJoin === ModelsEnum.Places) where.places = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Restaurants) where.restaurants = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Lodgings) where.lodgings = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Experiences) where.experiences = { id: Not(IsNull()) };

      return this.categoriesRepository.find({ where, order, relations });
    }

    if (modelId) {
      where.models = { id: modelId };

      const [modelCategories, generalCategories] = await Promise.all([
        this.categoriesRepository.find({ where, order, relations }),
        this.categoriesRepository.find({ where: { ...where, models: { id: IsNull() } }, order, relations }),
      ]);

      const categoryMap = new Map<string, Category>();
      modelCategories.forEach(category => categoryMap.set(category.id, category));
      generalCategories.forEach(category => categoryMap.set(category.id, category));

      return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    relations.models = true;
    return this.categoriesRepository.find({ where, order, relations });
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET CATEGORY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  findOne() {
    return 'This action returns a category by ID';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  update() {
    return 'This action updates a category';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  remove() {
    return 'This action removes a category';
  }
}
