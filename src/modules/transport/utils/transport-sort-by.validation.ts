import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { TransportSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'TransportSortByValidation', async: false })
export class TransportSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(TransportSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(TransportSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
