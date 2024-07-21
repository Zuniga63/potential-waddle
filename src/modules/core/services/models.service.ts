import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, Facility, Model } from '../entities';
import { Repository } from 'typeorm';
import { CreateModelDto } from '../dto';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
    @InjectRepository(Facility)
    private readonly facilitiesRepository: Repository<Facility>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW MODEL
  // * -------------------------------------------------------------------------------------------------------------
  async create(createModelDto: CreateModelDto) {
    const model = this.modelsRepository.create(createModelDto);
    return this.modelsRepository.save(model);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL MODELS
  // * -------------------------------------------------------------------------------------------------------------
  findAll() {
    return this.modelsRepository.find();
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET MODEL BY ID
  // * -------------------------------------------------------------------------------------------------------------
  findOne() {
    return 'This action returns a model by ID';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE MODEL
  // * -------------------------------------------------------------------------------------------------------------
  update() {
    return 'This action updates a model';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE MODEL
  // * -------------------------------------------------------------------------------------------------------------
  remove() {
    return 'This action removes a model';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * ADD CATEGORY TO MODEL
  // * -------------------------------------------------------------------------------------------------------------
  addCategory() {
    return 'This action adds a category to a model';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * REMOVE CATEGORY FROM MODEL
  // * -------------------------------------------------------------------------------------------------------------
  removeCategory() {
    return 'This action removes a category from a model';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * ADD FACILITY TO MODEL
  // * -------------------------------------------------------------------------------------------------------------
  addFacility() {
    return 'This action adds a facility to a model';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * REMOVE FACILITY FROM MODEL
  // * -------------------------------------------------------------------------------------------------------------
  removeFacility() {
    return 'This action removes a facility from a model';
  }
}
