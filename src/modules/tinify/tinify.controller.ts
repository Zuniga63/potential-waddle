import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { TinifyService } from './tinify.service';
import { CompressionStateDto } from './dtos/compression-state.dto';

@ApiTags(SwaggerTags.ImageResources)
@Controller('tinify')
export class TinifyController {
  constructor(private readonly tinifyService: TinifyService) {}

  @Get('compression-count')
  @ApiResponse({ type: CompressionStateDto })
  async getCompressionCount() {
    return this.tinifyService.getCompresionCount();
  }
}
