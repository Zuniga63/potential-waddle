import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { IValidationError } from '../filters/all-exceptions.filter';

interface ConstructorProps {
  /**
   * Maximum file size in MB. Default is 5 MB.
   */
  maxSize?: number;
  /**
   * Property name to be used in the error message. Default is 'file'.
   */
  propertyName?: string;
}

@Injectable()
export class ImageFileValidationPipe implements PipeTransform {
  private readonly maxSize: number;
  private readonly propertyName: string;
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

  constructor({ maxSize = 5, propertyName = 'file' }: ConstructorProps = {}) {
    // 5 MB default
    this.maxSize = (maxSize || 5) * 1024 * 1024;
    this.propertyName = propertyName;
  }

  transform(value: any) {
    const errors: IValidationError = {};
    // Check file type
    if (!this.allowedMimeTypes.includes(value.mimetype)) {
      errors[this.propertyName] = {
        message: 'Invalid file type. Only images are allowed.',
        value: value.originalname,
      };

      throw new BadRequestException({ message: `The ${this.propertyName} is invalid`, validationErrors: errors });
    }

    // Check file size
    if (value.size > this.maxSize) {
      errors[this.propertyName] = {
        message: `File size exceeds the maximum limit of ${this.maxSize / (1024 * 1024)} MB.`,
        value: value.originalname,
      };
      throw new BadRequestException({ message: `The ${this.propertyName} is invalid`, validationErrors: errors });
    }

    return value;
  }
}
