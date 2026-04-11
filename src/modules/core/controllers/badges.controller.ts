import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { Auth } from 'src/modules/auth/decorators';
import { CreateBadgeDto, UpdateBadgeDto, AdminBadgesFiltersDto } from '../dto';
import { BadgesService, BadgeEntityType } from '../services';

@Controller('badges')
@ApiTags(SwaggerTags.Badges)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL BADGES PAGINATED (ADMIN)
  // * -------------------------------------------------------------------------------------------------------------
  @Get('admin/list')
  @Auth()
  getAdminList(@Query() filters: AdminBadgesFiltersDto) {
    return this.badgesService.findAllPaginated(filters);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW BADGE
  // * -------------------------------------------------------------------------------------------------------------
  @Post()
  @Auth()
  create(@Body() createBadgeDto: CreateBadgeDto) {
    return this.badgesService.create(createBadgeDto);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL BADGES (PUBLIC)
  // * -------------------------------------------------------------------------------------------------------------
  @Get()
  findAll() {
    return this.badgesService.findAll();
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET BADGES FOR AN ENTITY
  // * -------------------------------------------------------------------------------------------------------------
  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get badges for a specific entity' })
  findBadgesByEntity(
    @Param('entityType') entityType: BadgeEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.badgesService.findBadgesByEntity(entityType, entityId);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * ASSIGN BADGES TO AN ENTITY
  // * -------------------------------------------------------------------------------------------------------------
  @Put('entity/:entityType/:entityId')
  @Auth()
  @ApiOperation({ summary: 'Assign badges to an entity (replaces existing)' })
  assignBadges(
    @Param('entityType') entityType: BadgeEntityType,
    @Param('entityId') entityId: string,
    @Body() body: { badgeIds: string[] },
  ) {
    return this.badgesService.assignBadges(entityType, entityId, body.badgeIds);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * REMOVE A BADGE FROM AN ENTITY
  // * -------------------------------------------------------------------------------------------------------------
  @Delete('entity/:entityType/:entityId/:badgeId')
  @Auth()
  @ApiOperation({ summary: 'Remove a badge from an entity' })
  removeBadgeFromEntity(
    @Param('entityType') entityType: BadgeEntityType,
    @Param('entityId') entityId: string,
    @Param('badgeId') badgeId: string,
  ) {
    return this.badgesService.removeBadgeFromEntity(entityType, entityId, badgeId);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET BADGE BY ID
  // * -------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Badge retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Badge not found' })
  findOne(@Param('id') id: string) {
    return this.badgesService.findOne(id);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPLOAD BADGE IMAGE
  // * -------------------------------------------------------------------------------------------------------------
  @Post(':id/image')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload badge image' })
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.badgesService.uploadImage(id, file);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE BADGE IMAGE
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id/image')
  @Auth()
  @ApiOperation({ summary: 'Delete badge image' })
  deleteImage(@Param('id') id: string) {
    return this.badgesService.deleteImage(id);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE BADGE
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Update badge by ID' })
  update(@Param('id') id: string, @Body() updateBadgeDto: UpdateBadgeDto) {
    return this.badgesService.update(id, updateBadgeDto);
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE BADGE
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: 'Delete badge by ID' })
  remove(@Param('id') id: string) {
    return this.badgesService.remove(id);
  }
}
