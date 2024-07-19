import { ValidationError } from '@nestjs/common';

// Mensajes constantes
const VALIDATION_FAILED_NESTED_OBJECTS = 'Validation failed in nested objects';

const mapChildrenErrors = (
  children: ValidationError[],
): Record<string, { message: string; value: any; children?: any }> => {
  return children.reduce(
    (acc, error) => {
      const { property, value, constraints, children } = error;
      let message = '';

      if (constraints) {
        message = Object.values(constraints).join(' ').trim();
      }

      if (children && children.length > 0) {
        acc[property] = {
          message: VALIDATION_FAILED_NESTED_OBJECTS,
          value,
          children: mapChildrenErrors(children),
        };
      } else {
        acc[property] = { message, value };
      }

      return acc;
    },
    {} as Record<string, { message: string; value: any; children?: any }>,
  );
};

export const mapValidationErrors = (
  errors: ValidationError[],
): Record<string, { message: string; value: any; children?: any }> => {
  return errors.reduce(
    (acc, validationError) => {
      const { property, value, constraints, children } = validationError;
      let message = '';

      if (constraints) {
        message = Object.values(constraints).join(' ').trim();
      }

      if (children && children.length > 0) {
        acc[property] = {
          message: VALIDATION_FAILED_NESTED_OBJECTS,
          value,
          children: mapChildrenErrors(children),
        };
      } else {
        acc[property] = { message, value };
      }

      return acc;
    },
    {} as Record<string, { message: string; value: any; children?: any }>,
  );
};
