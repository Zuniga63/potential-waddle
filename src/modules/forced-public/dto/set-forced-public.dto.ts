import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsUUID } from 'class-validator';

export const FORCED_PUBLIC_ENTITY_TYPES = [
  'lodging',
  'restaurant',
  'commerce',
  'transport',
  'guide',
  'place',
  'experience',
] as const;

export type ForcedPublicEntityType = (typeof FORCED_PUBLIC_ENTITY_TYPES)[number];

export class SetForcedPublicDto {
  @ApiProperty({ enum: FORCED_PUBLIC_ENTITY_TYPES, description: 'Business entity type' })
  @IsIn(FORCED_PUBLIC_ENTITY_TYPES)
  entityType: ForcedPublicEntityType;

  @ApiProperty({ description: 'Entity id (uuid)' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'When true, force the entity to be publicly visible regardless of status/subscription' })
  @IsBoolean()
  forcedPublic: boolean;
}
