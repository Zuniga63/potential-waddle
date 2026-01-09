import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Facility, Model } from '../entities';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { CreateFacilityDto, UpdateFacilityDto, AdminFacilitiesFiltersDto, AdminFacilitiesListDto } from '../dto';
import { ModelsEnum } from '../enums';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilitiesRepository: Repository<Facility>,
    @InjectRepository(Model)
    private readonly modelsRepository: Repository<Model>,
  ) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL FACILITIES PAGINATED (ADMIN)
  // * -------------------------------------------------------------------------------------------------------------
  async findAllPaginated(filters: AdminFacilitiesFiltersDto): Promise<AdminFacilitiesListDto> {
    const { page = 1, limit = 10, search, modelId, isEnabled, sortBy = 'name', sortOrder = 'ASC' } = filters;

    const queryBuilder = this.facilitiesRepository
      .createQueryBuilder('facility')
      .leftJoinAndSelect('facility.icon', 'icon')
      .leftJoinAndSelect('facility.models', 'models');

    if (search) {
      queryBuilder.andWhere('(facility.name ILIKE :search OR facility.slug ILIKE :search)', { search: `%${search}%` });
    }

    if (modelId) {
      queryBuilder.andWhere('models.id = :modelId', { modelId });
    }

    if (isEnabled !== undefined) {
      queryBuilder.andWhere('facility.isEnabled = :isEnabled', { isEnabled });
    }

    const validSortFields = ['name', 'slug', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.orderBy(`facility.${sortField}`, sortOrder);

    const count = await queryBuilder.getCount();
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    return {
      currentPage: page,
      pages: Math.ceil(count / limit),
      count,
      data,
    };
  }

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
    facility.isEnabled = true;
    return this.facilitiesRepository.save(facility);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  async findAll({ slug, innerJoin }: { slug?: string; innerJoin?: ModelsEnum } = {}) {
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
    console.log(slug);
    if (slug) {
      where.models = { slug };

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
  // * GET ALL FACILITY FULL
  // * -------------------------------------------------------------------------------------------------------------
  findAllFull() {
    return this.facilitiesRepository.find({ relations: { models: true } });
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET FACILITY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const facility = await this.facilitiesRepository.findOne({
      where: { id },
      relations: {
        icon: true,
        models: true,
        places: true,
        restaurants: true,
        lodgings: true,
        experiences: true,
        commerces: true,
      },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    return facility;
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  async update(id: string, updateFacilityDto: UpdateFacilityDto) {
    const facility = await this.facilitiesRepository.findOne({
      where: { id },
      relations: { models: true },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    const { models: modelsDto, ...rest } = updateFacilityDto;

    // Update basic fields
    Object.assign(facility, rest);

    // Update models if provided
    if (modelsDto && modelsDto.length) {
      const models = await this.modelsRepository.findBy({ id: In(modelsDto) });
      facility.models = models;
    }
    facility.isEnabled = true;

    return this.facilitiesRepository.save(facility);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const facility = await this.facilitiesRepository.findOne({ where: { id } });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    await this.facilitiesRepository.remove(facility);
    return { message: 'Facility deleted successfully' };
  }
}
