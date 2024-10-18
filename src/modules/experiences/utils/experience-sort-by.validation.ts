import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { ExperienceSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'PlaceSortByValidation', async: false })
export class ExperienceSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(ExperienceSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(ExperienceSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
