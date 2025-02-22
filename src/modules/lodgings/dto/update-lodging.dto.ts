import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLodgingDto } from './create-lodging.dto';

export class UpdateLodgingDto extends PartialType(OmitType(CreateLodgingDto, ['slug'] as const)) {}
