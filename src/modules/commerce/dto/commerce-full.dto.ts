import { CommerceIndexDto } from './commerce-index.dto';
import { Commerce } from '../entities';
import { ApiProperty } from '@nestjs/swagger';
import { Facility } from 'src/modules/core/entities';

export class CommerceFullDto extends CommerceIndexDto {
  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'List of languages spoken in the lodging',
    required: false,
  })
  spokenLanguages?: string[];

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

  facilities?: Facility[];

  paymentMethods?: string[];
  services?: string[];

  constructor(commerce?: Commerce) {
    super(commerce);

    if (!commerce) return;
    this.spokenLanguages = commerce.spokenLanguages;
    this.longitude = commerce.location?.coordinates[0];
    this.latitude = commerce.location?.coordinates[1];
    this.howToGetThere = commerce.howToGetThere || undefined;
    this.arrivalReference = commerce.arrivalReference || undefined;
    this.facilities = commerce.facilities;
    this.paymentMethods = commerce.paymentMethods;
    this.services = commerce.services;
  }
}
