import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { GoogleReviewSortByEnum } from '../constants';

@ValidatorConstraint({ name: 'GoogleReviewSortByValidation', async: false })
export class GoogleReviewSortByValidation implements ValidatorConstraintInterface {
  validate(value: any) {
    const regex = new RegExp(`^(-)?(${Object.values(GoogleReviewSortByEnum).join('|')})$`);
    return typeof value === 'string' && regex.test(value);
  }

  defaultMessage() {
    return `sortBy must be one of ${Object.values(GoogleReviewSortByEnum)
      .map(v => `-${v}, ${v}`)
      .join(', ')}`;
  }
}
