import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { validationPipeConfig } from 'src/config';

import { TransportFiltersDto } from '../dto';

export const TransportFilters = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const filters = plainToInstance(TransportFiltersDto, request.query);
  const errors = validateSync(filters, validationPipeConfig);

  errors?.forEach(error => {
    delete filters[error.property];
  });

  return filters;
});
