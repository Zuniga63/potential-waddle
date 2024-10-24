import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { LodgingSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'LodgingsSortByValidation', async: false })
export class LodgingSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(LodgingSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(LodgingSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
