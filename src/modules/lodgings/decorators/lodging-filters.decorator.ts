import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LodgingFiltersDto } from '../dto';
import { validateSync } from 'class-validator';
import { validationPipeConfig } from 'src/config';

export const LodgingFilters = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const filters = plainToInstance(LodgingFiltersDto, request.query, { enableImplicitConversion: true });
  const errors = validateSync(filters, validationPipeConfig);

  errors?.forEach(error => {
    delete filters[error.property];
  });

  return filters;
});
