import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';

import { Lodging } from './entities';
import { LodgingFullDto, LodgingIndexDto } from './dto';
import { LodgingFindAllParams } from './interfaces';
import { generateLodgingQueryFilters } from './utils';

@Injectable()
export class LodgingsService {
  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRespository: Repository<Lodging>,
  ) {}
  async findAll({ filters }: LodgingFindAllParams = {}) {
    const { where, order } = generateLodgingQueryFilters(filters);

    const relations: FindOptionsRelations<Lodging> = {
      town: { department: true },
      reviews: true,
      categories: { icon: true },
      images: { imageResource: true },
    };

    const lodgings = await this.lodgingRespository.find({ relations, order, where });

    return lodgings.map(lodgings => new LodgingIndexDto(lodgings));
  }

  async findOne({ identifier }: { identifier: string }) {
    const relations: FindOptionsRelations<Lodging> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    let place = await this.lodgingRespository.findOne({
      where: { slug: identifier },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!place) place = await this.lodgingRespository.findOne({ where: { id: identifier }, relations });
    if (!place) throw new NotFoundException('Lodging not found');

    return new LodgingFullDto(place);
  }
}
