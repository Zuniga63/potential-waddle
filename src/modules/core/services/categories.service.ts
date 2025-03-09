import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, Model } from '../entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
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
  async findAll({
    model,
    onlyEnabled = true,
    onlyAsigned = false,
  }: { model?: ModelsEnum; onlyEnabled?: boolean; onlyAsigned?: boolean } = {}) {
    let where: FindOptionsWhere<Category> | FindOptionsWhere<Category>[] = { isEnabled: onlyEnabled };

    const order: FindOptionsOrder<Category> = { name: 'ASC' };

    const relations: FindOptionsRelations<Category> = { icon: true, models: true };
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
