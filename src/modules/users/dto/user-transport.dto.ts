import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { User } from '../entities/user.entity';
import { Transport } from 'src/modules/transport/entities/transport.entity';

export class UserTransportDto extends UserDto {
  @ApiProperty({ example: '1234567890' })
  transportId: string;

  @ApiProperty({ example: 'true' })
  isAvailable: boolean;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'ABC123' })
  licensePlate: string;

  @ApiProperty({ example: '+573001234567' })
  phone: string;

  @ApiProperty({ example: '+573001234567', required: false })
  whatsapp?: string;

  @ApiProperty({ example: '08:00', required: false })
  startTime?: string;

  @ApiProperty({ example: '18:00', required: false })
  endTime?: string;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty({ example: ['cash', 'card'], required: false })
  paymentMethods?: string[];

  @ApiProperty({ example: 'Transporte' })
  categoryName?: string;

  constructor(user: User, transport: Transport) {
    if (!user) return;
    super(user);
    this.transportId = transport.id || '';
    this.isAvailable = transport.isAvailable || false;
    this.firstName = transport.firstName || '';
    this.lastName = transport.lastName || '';
    this.licensePlate = transport.licensePlate || '';
    this.phone = transport.phone || '';
    this.whatsapp = transport.whatsapp;
    this.startTime = transport.startTime;
    this.endTime = transport.endTime;
    this.isPublic = transport.isPublic || false;
    this.paymentMethods = transport.paymentMethods || [];
    this.categoryName = transport.categories?.[0]?.name || 'Transporte';
  }
}
