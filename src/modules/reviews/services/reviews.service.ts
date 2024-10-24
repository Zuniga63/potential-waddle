import { Injectable } from '@nestjs/common';
import { ReviewsFindAllParams } from '../interfaces';

@Injectable()
export class ReviewsService {
  constructor() {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL REVIEWS
  // * ----------------------------------------------------------------------------------------------------------------
  async findAll({ queries }: ReviewsFindAllParams) {
    return queries;
  }
}
