import { PartialType } from '@nestjs/swagger';
import { CreateLodgingRoomTypeDto } from './create-lodging-room-type.dto';

export class UpdateLodgingRoomTypeDto extends PartialType(CreateLodgingRoomTypeDto) {}
