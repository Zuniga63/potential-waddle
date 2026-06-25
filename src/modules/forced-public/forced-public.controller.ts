import { Body, Controller, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { SuperAdmin } from '../auth/decorators';

import { ForcedPublicService } from './forced-public.service';
import { SetForcedPublicDto } from './dto/set-forced-public.dto';

@ApiTags('Forced Public (super admin)')
@Controller('admin/forced-public')
@SuperAdmin()
export class ForcedPublicController {
  constructor(private readonly forcedPublicService: ForcedPublicService) {}

  @Patch()
  @ApiOkResponse({ description: 'forced_public flag updated' })
  set(@Body() dto: SetForcedPublicDto) {
    return this.forcedPublicService.setForcedPublic(dto.entityType, dto.id, dto.forcedPublic);
  }
}
