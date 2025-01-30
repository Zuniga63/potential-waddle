import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';

import { Commerce } from './entities';
import { CreateCommerceDto } from './dto/create-commerce.dto';
import { UpdateCommerceDto } from './dto/update-commerce.dto';
import { generateCommerceQueryFilters } from './utils';
import { CommerceFindAllParams } from './interfaces';
import { CommerceIndexDto } from './dto';

@Injectable()
export class CommerceService {
  constructor(
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
  ) {}

  create(createCommerceDto: CreateCommerceDto) {
    return this.commerceRepository.create(createCommerceDto);
  }

  async findAll({ filters }: CommerceFindAllParams = {}) {
    const { where, order } = generateCommerceQueryFilters(filters);

    const relations: FindOptionsRelations<Commerce> = {
      town: { department: true },
      reviews: true,
      categories: { icon: true },
      images: { imageResource: true },
    };

    const commerces = await this.commerceRepository.find({ relations, order, where });

    return commerces.map(commerces => new CommerceIndexDto(commerces));
  }

  findOne({ identifier }: { identifier: string }) {
    return this.commerceRepository.findOne({ where: { slug: identifier } });
  }

  update({ identifier }: { identifier: string }, updateCommerceDto: UpdateCommerceDto) {
    return this.commerceRepository.update({ slug: identifier }, updateCommerceDto);
  }

  remove({ identifier }: { identifier: string }) {
    return this.commerceRepository.delete({ slug: identifier });
  }
}
