import { PartialType } from '@nestjs/swagger';
import { CreatePublicEventDto } from './create-public-event.dto';

export class UpdatePublicEventDto extends PartialType(CreatePublicEventDto) {}