import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Facility, Model } from '../entities';
import { In, Repository } from 'typeorm';
import { CreateFacilityDto } from '../dto';

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
  async findAll({ modelId }: { modelId?: string } = {}) {
    if (!modelId) return this.facilitiesRepository.find({ order: { name: 'ASC' }, relations: { models: true } });

    const [modelFacilities, generalFacilities] = await Promise.all([
      this.facilitiesRepository
        .createQueryBuilder('facility')
        .leftJoin('facility.models', 'model')
        .where('model.id = :modelId', { modelId })
        .orderBy('facility.name', 'ASC')
        .getMany(),
      this.facilitiesRepository
        .createQueryBuilder('facility')
        .leftJoin('facility.models', 'model')
        .where('model IS NULL')
        .orderBy('facility.name', 'ASC')
        .getMany(),
    ]);

    const facilityMap = new Map<string, Facility>();
    generalFacilities.concat(modelFacilities).forEach(facility => {
      facilityMap.set(facility.id, facility);
    });

    return Array.from(facilityMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
