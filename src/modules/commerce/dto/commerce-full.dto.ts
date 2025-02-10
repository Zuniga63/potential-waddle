import { CommerceIndexDto } from './commerce-index.dto';
import { Commerce } from '../entities';
import { ApiProperty } from '@nestjs/swagger';

export class CommerceFullDto extends CommerceIndexDto {
  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'List of languages spoken in the lodging',
    required: false,
  })
  spokenLangueges?: string[];

  @ApiProperty({
    example: 'How to get there',
    description: 'The way to get to the place',
    required: false,
  })
  howToGetThere?: string;

  @ApiProperty({
    example: 'Arrival reference',
    description: 'The arrival reference of the place',
    required: false,
  })
  arrivalReference?: string;

  @ApiProperty({
    example: '19.432608',
    description: 'The longitude of the place',
    required: false,
  })
  longitude?: number;

  @ApiProperty({
    example: '19.432608',
    description: 'The latitude of the place',
    required: false,
  })
  latitude?: number;

  constructor(commerce?: Commerce) {
    super(commerce);

    if (!commerce) return;
    this.spokenLangueges = commerce.spokenLangueges;
    this.longitude = commerce.location?.coordinates[0];
    this.latitude = commerce.location?.coordinates[1];
    this.howToGetThere = commerce.howToGetThere || undefined;
    this.arrivalReference = commerce.arrivalReference || undefined;
  }
}
