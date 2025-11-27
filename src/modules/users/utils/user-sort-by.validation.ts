import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { UserSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'UserSortByValidation', async: false })
export class UserSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(UserSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(UserSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
