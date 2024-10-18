import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { validationPipeConfig } from 'src/config';

import { RestaurantFiltersDto } from '../dto';

export const RestaurantFilters = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const filters = plainToInstance(RestaurantFiltersDto, request.query);
  const errors = validateSync(filters, validationPipeConfig);

  errors?.forEach(error => {
    delete filters[error.property];
  });

  return filters;
});
