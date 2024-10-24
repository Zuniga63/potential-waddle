import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SortOrder } from '../types';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { validationPipeConfig } from 'src/config';

export function GenericFindAllFilters<T>(dtoClass: new () => T, sortByEnum?: object) {
  return createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Handle 'sort-by' parameter
    const sortByValue = request.query['sort-by'];

    if (sortByValue && sortByEnum) {
      const sortByEnumValues = Object.values(sortByEnum).map(String);
      const regex = new RegExp(`^-?(${sortByEnumValues.join('|')})$`);

      if (!regex.test(sortByValue)) {
        throw new BadRequestException(
          `Invalid sort-by value. Must be one of: ${sortByEnumValues.map(v => `-${v}, ${v}`).join(', ')}`,
        );
      }

      const order: SortOrder = sortByValue.startsWith('-') ? 'desc' : 'asc';
      const property = sortByValue.replace(/^-/, '');

      request.query['sort-by'] = { property, order };
    }

    // Transform and validate query parameters
    const filters = plainToInstance(dtoClass, request.query);

    const errors = validateSync(filters as any, validationPipeConfig);

    errors?.forEach(error => {
      delete filters[error.property];
    });

    return filters;
  })();
}
