import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';

import { Commerce } from './entities';
import { CreateCommerceDto } from './dto/create-commerce.dto';
import { UpdateCommerceDto } from './dto/update-commerce.dto';
import { generateCommerceQueryFilters } from './utils';
import { CommerceFindAllParams } from './interfaces';
import { CommerceIndexDto } from './dto';
import { CommerceFullDto } from './dto/commerce-full.dto';

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

  async findOne({ identifier }: { identifier: string }) {
    const relations: FindOptionsRelations<Commerce> = {
      categories: { icon: true },
      facilities: { icon: true },
      town: { department: true },
      images: { imageResource: true },
    };

    let place = await this.commerceRepository.findOne({
      where: { slug: identifier },
      relations,
      order: { images: { order: 'ASC' } },
    });

    if (!place) place = await this.commerceRepository.findOne({ where: { id: identifier }, relations });
    if (!place) throw new NotFoundException('Commerce not found');

    return new CommerceFullDto(place);
  }

  update({ identifier }: { identifier: string }, updateCommerceDto: UpdateCommerceDto) {
    return this.commerceRepository.update({ slug: identifier }, updateCommerceDto);
  }

  remove({ identifier }: { identifier: string }) {
    return this.commerceRepository.delete({ slug: identifier });
  }
}
