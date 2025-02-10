import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsEmail, IsOptional, IsBoolean, IsUUID, IsNotEmpty, IsArray } from 'class-validator';
import { parseArrayValue } from 'src/utils';

export class CreateGuideDto {
  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- PERSONAL INFO -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the guide',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the guide',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the guide',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- DOCUMENT INFO ----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    example: 'CC',
    description: 'The type of identification document',
  })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({
    example: '1234567890',
    description: 'The identification document number',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- CONTACT INFO -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    example: '+573001234567',
    description: 'Phone number of the guide',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: '+573001234567',
    description: 'WhatsApp number of the guide',
    required: false,
  })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiProperty({
    example: 'Calle 123 #45-67',
    description: 'Physical address of the guide',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- PROFILE INFO -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    example: 'Experienced guide with 10 years of service...',
    description: 'Professional biography of the guide',
    required: false,
  })
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty({
    example: 'English, Spanish, French',
    description: 'Languages spoken by the guide',
    required: false,
  })
  @IsString()
  @IsOptional()
  languages?: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- SOCIAL MEDIA -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    example: 'https://facebook.com/username',
    description: 'Facebook profile URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com/username',
    description: 'Instagram profile URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({
    example: 'https://youtube.com/channel',
    description: 'YouTube channel URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  youtube?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@username',
    description: 'TikTok profile URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  tiktok?: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- SERVICE INFO -----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    example: true,
    description: 'Whether the guide is currently available',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  // * ----------------------------------------------------------------------------------------------------------------
  // * -------------------------------------- RELATIONSHIPS ----------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  @ApiProperty({
    description: 'Town ID where the guide operates',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  townId: string;

  @ApiProperty({
    description: 'User ID associated with this transport provider',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  userId: string;

  @ApiProperty({
    description: 'Categories IDs for the guide services',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => parseArrayValue(value))
  categoryIds?: string[];
}
