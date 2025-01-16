import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';
import { User } from '../entities/user.entity';
import { Transport } from 'src/modules/transport/entities/transport.entity';

export class UserTransportDto extends UserDto {
  @ApiProperty({ example: '1234567890' })
  transportId: string;

  @ApiProperty({ example: 'true' })
  isAvailable: boolean;

  constructor(user: User, transport: Transport) {
    if (!user) return;
    super(user);
    this.transportId = transport.id || '';
    this.isAvailable = transport.isAvailable || false;
  }
}
