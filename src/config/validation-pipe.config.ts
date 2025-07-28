import { BadRequestException, ValidationPipeOptions, ValidationError } from '@nestjs/common';
import { mapValidationErrors } from 'src/utils/map-validation-errors';

export const validationPipeConfig: ValidationPipeOptions = {
  validationError: { target: true, value: true },

  transform: true, // Habilita las transformaciones de class-transformer

  whitelist: true, // Elimina las propiedades no especificadas en los DTO

  forbidNonWhitelisted: true, // Lanza una excepción si se encuentran propiedades no permitidas

  stopAtFirstError: true, // Detiene la validación en el primer error encontrado

  exceptionFactory(errors: ValidationError[]) {
    const validationErrors = mapValidationErrors(errors);
    return new BadRequestException({ validationErrors });
  },
};
