import { ApiProperty } from '@nestjs/swagger';

class ValidationErrorItem {
  @ApiProperty({ example: 'email must be an email' })
  message: string;

  @ApiProperty({ example: 'jhondoe@email' })
  value: any;

  @ApiProperty({ type: [ValidationErrorItem], required: false })
  children?: ValidationErrorItem[];
}

export class ValidationErrorDto {
  @ApiProperty({ type: 'integer', example: 400 })
  statusCode: number;

  @ApiProperty({ example: '/api/auth/local/register' })
  path: string;

  @ApiProperty({ example: 'BadRequestException' })
  errorType: string;

  @ApiProperty({ example: '2024-06-23T00:37:09.245Z' })
  timestamp: string;

  @ApiProperty({ example: 'Validation error in the request' })
  errorMessage: string;

  @ApiProperty({ type: () => ValidationErrorItem, isArray: true })
  errors: Record<string, ValidationErrorItem>;
}
