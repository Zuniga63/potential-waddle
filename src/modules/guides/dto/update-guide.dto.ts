import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { CreateGuideDto } from './create-guide.dto';

// PartialType makes every remaining field optional so the wizard can PATCH a
// single step (firstName + lastName + document...) without having to resend the
// full create payload. OmitType strips `slug` because it's derived server-side.
export class UpdateGuideDto extends PartialType(OmitType(CreateGuideDto, ['slug'])) {
  @ApiProperty({
    description:
      'Slugs of optional fields the owner explicitly marked "No tengo / No aplica" from the wizard. Persisted so the badge survives logout.',
    required: false,
    type: [String],
    example: ['facebook', 'instagram'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skippedOptionalFields?: string[];
}
