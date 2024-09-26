import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { RestaurantDto } from './dto';
import { Restaurant } from './entities';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async findAll() {
    const restaurants = await this.restaurantRepository.find({
      relations: { town: { department: true }, categories: { icon: true }, images: { imageResource: true } },
    });

    return restaurants.map(restaurant => new RestaurantDto({ data: restaurant }));
  }

  async findOne(slug: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { slug },
      relations: {
        town: { department: true },
        categories: { icon: true },
        images: { imageResource: true },
        facilities: { icon: true },
      },
    });

    if (!restaurant) throw new NotFoundException(`Restaurant with slug ${slug} not found`);
    return new RestaurantDto({ data: restaurant });
  }
}
