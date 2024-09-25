import { Injectable, NotImplementedException } from '@nestjs/common';
import { ExperienceDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Experience } from './entities';
import { Repository } from 'typeorm';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
  ) {}
  async findAll(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.find({
      relations: { categories: true, images: { imageResource: true }, town: { department: true } },
      order: { images: { order: 'ASC' } },
    });

    return experiences.map(experience => new ExperienceDto({ data: experience }));
  }

  async findOne(identifier: string) {
    const experience = await this.experienceRepository.findOne({
      where: { slug: identifier },
      relations: { categories: true, facilities: true, images: { imageResource: true }, town: { department: true } },
      order: { images: { order: 'ASC' } },
    });

    if (!experience) throw new NotImplementedException('Experience not found');
    return new ExperienceDto({ data: experience });
  }
}
