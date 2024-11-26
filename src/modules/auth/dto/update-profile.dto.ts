import { IsEmail } from 'class-validator';
import { IsOptional } from 'class-validator';
import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({ required: false, example: 'United States' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false, example: 'California' })
  @IsString()
  @IsOptional()
  countryState?: string;

  @ApiProperty({ required: false, example: 'Los Angeles' })
  @IsString()
  @IsOptional()
  city: string;
}
