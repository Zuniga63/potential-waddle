import { OmitType } from '@nestjs/mapped-types';
import { CreateGuideDto } from './create-guide.dto';

export class UpdateGuideDto extends OmitType(CreateGuideDto, ['slug']) {}
