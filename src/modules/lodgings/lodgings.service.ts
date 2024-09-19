import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';

import { Lodging } from './entities';
import { LodgingIndexDto } from './dto';

@Injectable()
export class LodgingsService {
  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRespository: Repository<Lodging>,
  ) {}
  async findAll() {
    const where: FindOptionsWhere<Lodging> = {};
    const order: FindOptionsOrder<Lodging> = { name: 'ASC', images: { order: 'ASC' } };

    const relations: FindOptionsRelations<Lodging> = {
      town: { department: true },
      reviews: true,
      categories: { icon: true },
      images: { imageResource: true },
    };

    const lodgings = await this.lodgingRespository.find({ relations, order, where });

    return lodgings.map(lodgings => new LodgingIndexDto(lodgings));
  }

  findOne(id: number) {
    return `This action returns a #${id} lodging`;
  }
}
