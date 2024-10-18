import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { RestaurantSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'PlaceSortByValidation', async: false })
export class RestaurantSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(RestaurantSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(RestaurantSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
