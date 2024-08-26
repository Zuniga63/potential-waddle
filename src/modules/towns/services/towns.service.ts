import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Department, Town } from '../entities';
import { CreateTownDto, UpdateTownDto } from '../dto';

@Injectable()
export class TownsService {
  constructor(
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    @InjectRepository(Department)
    private readonly municipalityRepository: Repository<Department>,
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
}
