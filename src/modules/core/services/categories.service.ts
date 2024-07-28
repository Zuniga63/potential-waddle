import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, Model } from '../entities';
import { In, Repository } from 'typeorm';
import { CreateCategoryDto } from '../dto';

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
  async findAll({ modelId }: { modelId?: string } = {}) {
    if (!modelId) return this.categoriesRepository.find({ order: { name: 'ASC' }, relations: { models: true } });

    const [modelCategories, generalCategories] = await Promise.all([
      this.categoriesRepository
        .createQueryBuilder('category')
        .leftJoin('category.models', 'model')
        .where('model.id = :modelId', { modelId })
        .orderBy('category.name', 'ASC')
        .getMany(),
      this.categoriesRepository
        .createQueryBuilder('category')
        .leftJoin('category.models', 'model')
        .where('model IS NULL')
        .orderBy('category.name', 'ASC')
        .getMany(),
    ]);

    const categoryMap = new Map<string, Category>();
    generalCategories.concat(modelCategories).forEach(category => {
      categoryMap.set(category.id, category);
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
