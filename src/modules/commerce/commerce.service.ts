import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Commerce } from './entities';
import { CreateCommerceDto } from './dto/create-commerce.dto';
import { UpdateCommerceDto } from './dto/update-commerce.dto';

@Injectable()
export class CommerceService {
  constructor(
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
  ) {}

  create(createCommerceDto: CreateCommerceDto) {
    return this.commerceRepository.create(createCommerceDto);
  }

  findAll() {
    return this.commerceRepository.find();
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
