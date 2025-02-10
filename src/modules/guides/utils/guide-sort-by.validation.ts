import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { GuideSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'GuideSortByValidation', async: false })
export class GuideSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(GuideSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(GuideSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
