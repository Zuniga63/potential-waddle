import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { validationPipeConfig } from 'src/config';

import { GoogleReviewsFiltersDto } from '../dto/google-reviews-filters.dto';

export const GoogleReviewsFilters = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const filters = plainToInstance(GoogleReviewsFiltersDto, request.query);
  const errors = validateSync(filters, validationPipeConfig);
  errors?.forEach(error => {
    delete filters[error.property];
  });

  return filters;
});
