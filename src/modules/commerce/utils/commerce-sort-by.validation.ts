import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { CommerceSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'CommerceSortByValidation', async: false })
export class CommerceSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(CommerceSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(CommerceSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
