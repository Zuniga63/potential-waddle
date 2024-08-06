import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { PlaceSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'PlaceSortByValidation', async: false })
export class PlaceSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(PlaceSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(PlaceSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
