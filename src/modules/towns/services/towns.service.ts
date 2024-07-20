import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Municipality, Town } from '../entities';
import { CreateTownDto, UpdateTownDto } from '../dto';

@Injectable()
export class TownsService {
  constructor(
    @InjectRepository(Town)
    private readonly townRepository: Repository<Town>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
  ) {}

  async create(createTownDto: CreateTownDto) {
    const { lang = 'es', description, municipalityId, ...res } = createTownDto;
    const town = this.townRepository.create({ ...res });

    if (lang === 'es') town.description = description;
    else if (lang === 'en') town.description_en = description;

    if (municipalityId) {
      const municipality = await this.municipalityRepository.findOne({ where: { id: municipalityId } });
      if (municipality) town.municipality = municipality;
    }

    return this.townRepository.save(town);
  }

  findAll() {
    return this.townRepository.find();
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
    else if (lang === 'en') town.description_en = description;

    if (municipalityId) {
      const municipality = await this.municipalityRepository.findOne({ where: { id: municipalityId } });
      if (municipality) town.municipality = municipality;
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
