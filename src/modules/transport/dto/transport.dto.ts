import { CategoryDto } from 'src/modules/core/dto';
import { TownDto } from 'src/modules/towns/dto';
import { Transport } from '../entities/transport.entity';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TransportDto {
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the transport',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the transport',
  })
  firstName: string;
  lastName: string;
  documentType: string;
  document: string;
  phone: string;
  whatsapp?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  licensePlate?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Relationships
  town?: TownDto;
  user?: UserDto;
  categories?: CategoryDto[];

  constructor({ data }: { data: Transport }) {
    if (!data) return;

    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.documentType = data.documentType;
    this.document = data.document;
    this.phone = data.phone;
    this.whatsapp = data.whatsapp;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.isAvailable = data.isAvailable;
    this.licensePlate = data.licensePlate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    // Map relationships
    this.town = data.town ? new TownDto(data.town) : undefined;
    this.user = data.user ? new UserDto(data.user) : undefined;
    this.categories = data.categories?.map(category => new CategoryDto(category));
  }
}
