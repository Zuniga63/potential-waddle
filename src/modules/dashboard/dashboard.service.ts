import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lodging } from '../lodgings/entities/lodging.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Place } from '../places/entities/place.entity';
import { Commerce } from '../commerce/entities/commerce.entity';
import { Review } from '../reviews/entities/review.entity';
import { Guide } from '../guides/entities/guide.entity';
import { Experience } from '../experiences/entities/experience.entity';
import { Transport } from '../transport/entities/transport.entity';

export interface DashboardStats {
  totalLodgings: number;
  totalRestaurants: number;
  totalPlaces: number;
  totalCommerce: number;
  totalReviews: number;
  totalGuides: number;
  totalExperiences: number;
  totalTransport: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lodging)
    private readonly lodgingRepository: Repository<Lodging>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Guide)
    private readonly guideRepository: Repository<Guide>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,
  ) {}

  async getStats(townId?: string): Promise<DashboardStats> {
    const townFilter = townId ? { town: { id: townId } } : {};
    const guideTownFilter = townId ? { towns: { id: townId } } : {};

    const [
      totalLodgings,
      totalRestaurants,
      totalPlaces,
      totalCommerce,
      totalReviews,
      totalGuides,
      totalExperiences,
      totalTransport,
    ] = await Promise.all([
      this.lodgingRepository.count({ where: townFilter }),
      this.restaurantRepository.count({ where: townFilter }),
      this.placeRepository.count({ where: townFilter }),
      this.commerceRepository.count({ where: townFilter }),
      this.countReviewsByTown(townId),
      this.guideRepository.count({ where: guideTownFilter }),
      this.experienceRepository.count({ where: townFilter }),
      this.transportRepository.count({ where: townFilter }),
    ]);

    return {
      totalLodgings,
      totalRestaurants,
      totalPlaces,
      totalCommerce,
      totalReviews,
      totalGuides,
      totalExperiences,
      totalTransport,
    };
  }

  private async countReviewsByTown(townId?: string): Promise<number> {
    if (!townId) {
      return this.reviewRepository.count();
    }

    // Reviews don't have direct town relation, need to join through place/lodging/etc
    const count = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.place', 'place')
      .leftJoin('review.lodging', 'lodging')
      .leftJoin('review.experience', 'experience')
      .leftJoin('review.commerce', 'commerce')
      .leftJoin('review.restaurant', 'restaurant')
      .leftJoin('review.transport', 'transport')
      .leftJoin('review.guide', 'guide')
      .where('place.town_id = :townId', { townId })
      .orWhere('lodging.town_id = :townId', { townId })
      .orWhere('experience.town_id = :townId', { townId })
      .orWhere('commerce.town_id = :townId', { townId })
      .orWhere('restaurant.town_id = :townId', { townId })
      .orWhere('transport.town_id = :townId', { townId })
      .orWhere('guide.town_id = :townId', { townId })
      .getCount();

    return count;
  }
}
