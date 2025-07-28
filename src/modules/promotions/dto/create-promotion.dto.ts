import { IsString, IsNotEmpty, IsDateString, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsIn(['lodging', 'restaurant', 'experience', 'guide'])
  @IsNotEmpty()
  entityType: 'lodging' | 'restaurant' | 'experience' | 'guide';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @IsDateString()
  @IsNotEmpty()
  validTo: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber()
  @IsNotEmpty()
  value: number;
}
