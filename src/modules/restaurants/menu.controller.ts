import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';
import { MenuService } from './services/menu.service';
import { AnthropicMenuExtractionService } from './services/anthropic-menu-extraction.service';
import { MenuDto } from './dto';
import { ContentTypes } from '../common/constants';

@Controller('restaurants/:restaurantId/menus')
@ApiTags('Restaurant Menus')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly anthropicMenuExtractionService: AnthropicMenuExtractionService,
  ) {}

  @Get()
  @Auth()
  @ApiOkResponse({ description: 'List all menus for restaurant', type: [MenuDto] })
  findAll(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.findAllByRestaurant(restaurantId);
  }

  @Get('latest')
  @Auth()
  @ApiOkResponse({ description: 'Get latest completed menu', type: MenuDto })
  findLatest(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.findLatest(restaurantId);
  }

  @Get(':menuId')
  @Auth()
  @ApiOkResponse({ description: 'Get menu by ID', type: MenuDto })
  findOne(@Param('menuId', ParseUUIDPipe) menuId: string) {
    return this.menuService.findOne(menuId);
  }

  @Post('upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes(ContentTypes.MULTIPART_FORM_DATA)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ description: 'Upload and process menu file', type: MenuDto })
  upload(@Param('restaurantId', ParseUUIDPipe) restaurantId: string, @UploadedFile() file: Express.Multer.File) {
    return this.menuService.processAndCreate(restaurantId, file);
  }

  // TODO(Phase 7): temporary test trigger — remove/replace with seam wiring
  // Phase 8 (SEC-02) will add rate-limiting/throttle hardening before this path reaches production.
  // This endpoint is explicitly marked temporary and MUST be removed or replaced before prod cutover.
  @Post('extract-test')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes(ContentTypes.MULTIPART_FORM_DATA)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    description:
      'TEMP (Phase 6): extract menu via Anthropic, returns MenuData + confidence sidecar (no DB write)',
  })
  extractTest(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('townSlug') townSlug?: string,
  ) {
    return this.anthropicMenuExtractionService.processMenuFile(file, {
      restaurantId,
      townSlug: townSlug ?? 'dev',
    });
  }

  @Delete(':menuId')
  @Auth()
  @ApiOkResponse({ description: 'Delete menu' })
  delete(@Param('restaurantId', ParseUUIDPipe) restaurantId: string, @Param('menuId', ParseUUIDPipe) menuId: string) {
    return this.menuService.delete(menuId);
  }
}
