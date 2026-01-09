import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMunicipalityDto, UpdateMunicipalityDto, AdminDepartmentsFiltersDto, AdminDepartmentsListDto } from '../dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from '../entities';
import { Repository } from 'typeorm';

@Injectable()
export class MunicipalitiesService {
  constructor(
    @InjectRepository(Department)
    private readonly municipalityRepository: Repository<Department>,
  ) {}

  create(municipalityDto: CreateMunicipalityDto) {
    const municipality = this.municipalityRepository.create(municipalityDto);
    return this.municipalityRepository.save(municipality);
  }

  findAll() {
    return this.municipalityRepository.find();
  }

  async findAllPaginated(filters: AdminDepartmentsFiltersDto): Promise<AdminDepartmentsListDto> {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'ASC' } = filters;

    const queryBuilder = this.municipalityRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.towns', 'towns');

    // Search filter
    if (search) {
      queryBuilder.andWhere('department.name ILIKE :search', { search: `%${search}%` });
    }

    // Sorting
    const validSortFields = ['name', 'capital', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.orderBy(`department.${sortField}`, sortOrder);

    // Get total count
    const count = await queryBuilder.getCount();

    // Pagination
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

  async findOne(id: string) {
    const municipality = await this.municipalityRepository.findOne({ where: { id } });
    if (!municipality) throw new NotFoundException('Municipality not found');

    return municipality;
  }

  async update(id: string, updateMunicipalityDto: UpdateMunicipalityDto) {
    const municipality = await this.findOne(id);
    this.municipalityRepository.merge(municipality, updateMunicipalityDto);
    return this.municipalityRepository.save(municipality);
  }

  async remove(id: string) {
    const { affected } = await this.municipalityRepository.delete(id);
    if (!affected) throw new NotFoundException('Municipality not found');
    return;
  }
}
