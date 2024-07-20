import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMunicipalityDto, UpdateMunicipalityDto } from '../dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Municipality } from '../entities';
import { Repository } from 'typeorm';

@Injectable()
export class MunicipalitiesService {
  constructor(
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
  ) {}

  create(municipalityDto: CreateMunicipalityDto) {
    const municipality = this.municipalityRepository.create(municipalityDto);
    return this.municipalityRepository.save(municipality);
  }

  findAll() {
    return this.municipalityRepository.find();
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
