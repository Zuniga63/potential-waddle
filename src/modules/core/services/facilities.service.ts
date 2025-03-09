import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Facility, Model } from '../entities';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { CreateFacilityDto } from '../dto';
import { ModelsEnum } from '../enums';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilitiesRepository: Repository<Facility>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  async create(createFacilityDto: CreateFacilityDto) {
    const { models: modelsDto, ...res } = createFacilityDto;
    const facility = this.facilitiesRepository.create(res);

    if (modelsDto && modelsDto.length) {
      const models = await this.modelsRepository.findBy({ id: In(modelsDto) });
      facility.models = models;
    }

    return this.facilitiesRepository.save(facility);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  async findAll({ modelId, innerJoin }: { modelId?: string; innerJoin?: ModelsEnum } = {}) {
    const where: FindOptionsWhere<Facility> = { isEnabled: true };
    const order: FindOptionsOrder<Facility> = { name: 'ASC' };
    const relations: FindOptionsRelations<Facility> = { icon: true };

    if (innerJoin) {
      if (innerJoin === ModelsEnum.Places) where.places = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Restaurants) where.restaurants = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Lodgings) where.lodgings = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Experiences) where.experiences = { id: Not(IsNull()) };
      if (innerJoin === ModelsEnum.Commerce) where.commerces = { id: Not(IsNull()) };

      return this.facilitiesRepository.find({ where, order, relations });
    }

    if (modelId) {
      where.models = { id: modelId };

      const [modelFacilities, generalFacilities] = await Promise.all([
        this.facilitiesRepository.find({ where, order, relations }),
        this.facilitiesRepository.find({ where: { ...where, models: { id: IsNull() } }, order, relations }),
      ]);

      const facilityMap = new Map<string, Facility>();
      modelFacilities.concat(generalFacilities).forEach(facility => {
        facilityMap.set(facility.id, facility);
      });

      return Array.from(facilityMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    relations.models = true;
    return this.facilitiesRepository.find({ where, order, relations });
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET FACILITY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  findOne() {
    return 'This action returns a facility by ID';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  update() {
    return 'This action updates a facility';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  remove() {
    return 'This action removes a facility';
  }
}
