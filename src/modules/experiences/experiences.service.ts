import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotImplementedException } from '@nestjs/common';

import { ExperienceDto } from './dto';
import { Experience } from './entities';
import type { ExperienceFindAllParams } from './interfaces';
import { generateExperienceQueryFiltersAndSort } from './logic';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
  ) {}
  async findAll({ filters }: ExperienceFindAllParams = {}): Promise<ExperienceDto[]> {
    const { where, order } = generateExperienceQueryFiltersAndSort(filters);
    const experiences = await this.experienceRepository.find({
      relations: { categories: true, images: { imageResource: true }, town: { department: true } },
      order,
      where,
    });

    return experiences.map(experience => new ExperienceDto({ data: experience }));
  }

  async findOne(identifier: string) {
    const experience = await this.experienceRepository.findOne({
      where: { slug: identifier },
      relations: {
        categories: { icon: true },
        facilities: true,
        images: { imageResource: true },
        town: { department: true },
      },
      order: { images: { order: 'ASC' } },
    });

    if (!experience) throw new NotImplementedException('Experience not found');
    return new ExperienceDto({ data: experience });
  }
}
