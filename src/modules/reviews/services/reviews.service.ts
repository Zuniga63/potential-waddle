import { Injectable } from '@nestjs/common';
import { ReviewsFindAllParams } from '../interfaces';
import { Repository } from 'typeorm';
import { Review } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminReviewsDto } from '../dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  async findAll({ queries }: ReviewsFindAllParams) {
    const { page = 1, limit = 25 } = queries;

    const skip = (page - 1) * limit;

    const [reviews, count] = await this.reviewsRepository.findAndCount({
      skip,
      take: limit,
      relations: {
        user: true,
        place: { images: { imageResource: true } },
        lodging: { images: { imageResource: true } },
      },
      select: {
        user: { username: true, id: true },
        place: { id: true, name: true, images: true },
      },
    });

    return new AdminReviewsDto({ currentPage: page, pages: Math.ceil(count / limit), count }, reviews);
  }
}
