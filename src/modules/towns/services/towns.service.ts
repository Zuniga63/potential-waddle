import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, In } from 'typeorm';

import { Department, Town } from '../entities';
import { CreateTownDto, UpdateTownDto } from '../dto';
import { AdminTownsFiltersDto } from '../dto/admin-towns-filters.dto';
import { AdminTownsListDto } from '../dto/admin-towns-list.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TownsService {
  constructor(
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    @InjectRepository(Department)
    private readonly municipalityRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTownDto: CreateTownDto) {
    const { lang = 'es', description, municipalityId, ...res } = createTownDto;
    const town = this.townRepository.create({ ...res });

    if (lang === 'es') town.description = description;

    if (municipalityId) {
      const municipality = await this.municipalityRepository.findOne({ where: { id: municipalityId } });
      if (municipality) town.department = municipality;
    }

    return this.townRepository.save(town);
  }

  findAll() {
    return this.townRepository.find({ where: { isEnable: true } });
  }

  async findAllPaginated(filters: AdminTownsFiltersDto): Promise<AdminTownsListDto> {
    const { page = 1, limit = 10, search, departmentId, isEnable, sortBy = 'name', sortOrder = 'ASC' } = filters;

    const where: FindOptionsWhere<Town> = {};

    if (isEnable !== undefined) {
      where.isEnable = isEnable;
    }

    if (departmentId) {
      where.department = { id: departmentId };
    }

    const queryBuilder = this.townRepository
      .createQueryBuilder('town')
      .leftJoinAndSelect('town.department', 'department');

    if (search) {
      queryBuilder.andWhere('(town.name ILIKE :search OR town.code ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (isEnable !== undefined) {
      queryBuilder.andWhere('town.isEnable = :isEnable', { isEnable });
    }

    if (departmentId) {
      queryBuilder.andWhere('department.id = :departmentId', { departmentId });
    }

    // Sorting: always sort by isEnable first (active first), then by selected field
    const validSortFields = ['name', 'code', 'createdAt', 'updatedAt', 'isEnable'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder
      .orderBy('town.isEnable', 'DESC')
      .addOrderBy(`town.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [towns, count] = await queryBuilder.getManyAndCount();
    const pages = Math.ceil(count / limit);

    return new AdminTownsListDto({ currentPage: page, pages, count }, towns);
  }

  async findOne(id: string) {
    const town = await this.townRepository.findOne({ where: { id } });
    if (!town) throw new NotFoundException('Town not found');

    return town;
  }

  async update(id: string, updateTownDto: UpdateTownDto) {
    const { lang = 'es', description, municipalityId, ...res } = updateTownDto;

    const town = await this.findOne(id);
    if (lang === 'es') town.description = description;

    if (municipalityId) {
      const municipality = await this.municipalityRepository.findOne({ where: { id: municipalityId } });
      if (municipality) town.department = municipality;
    }

    this.townRepository.merge(town, res);
    return this.townRepository.save(town);
  }

  async remove(id: string) {
    const { affected } = await this.townRepository.delete(id);
    if (!affected) throw new NotFoundException('Town not found');

    return;
  }

  async findAllForMap() {
    const towns = await this.townRepository
      .createQueryBuilder('town')
      .leftJoinAndSelect('town.department', 'department')
      .loadRelationCountAndMap('town.lodgingsCount', 'town.lodgings')
      .loadRelationCountAndMap('town.restaurantsCount', 'town.restaurants')
      .loadRelationCountAndMap('town.placesCount', 'town.places')
      .loadRelationCountAndMap('town.experiencesCount', 'town.experiences')
      .loadRelationCountAndMap('town.commercesCount', 'town.commerces')
      .loadRelationCountAndMap('town.transportsCount', 'town.transports')
      .where('town.isEnable = :isEnable', { isEnable: true })
      .andWhere('town.location IS NOT NULL')
      .getMany();

    return towns.map(town => {
      const point = town.location as any;
      return {
        id: town.id,
        name: town.name,
        slug: town.slug,
        description: town.description,
        department: town.department?.name || null,
        coordinates: point
          ? {
              lat: point.coordinates[1],
              lng: point.coordinates[0],
            }
          : null,
        stats: {
          lodgings: (town as any).lodgingsCount || 0,
          restaurants: (town as any).restaurantsCount || 0,
          places: (town as any).placesCount || 0,
          experiences: (town as any).experiencesCount || 0,
          commerces: (town as any).commercesCount || 0,
          transports: (town as any).transportsCount || 0,
        },
      };
    });
  }
}
