import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { LodgingRoomTypesService } from './lodging-room-types.service';
import { CreateLodgingRoomTypeDto, UpdateLodgingRoomTypeDto } from './dto';

@Controller('lodgings/:lodgingId/room-types')
@ApiTags(SwaggerTags.Lodgings)
export class LodgingRoomTypesController {
  constructor(private readonly lodgingRoomTypesService: LodgingRoomTypesService) {}

  @Post()
  @ApiOkResponse({ description: 'Room type created successfully' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  create(
    @Param('lodgingId', ParseUUIDPipe) lodgingId: string,
    @Body() createLodgingRoomTypeDto: CreateLodgingRoomTypeDto,
  ) {
    return this.lodgingRoomTypesService.create(lodgingId, createLodgingRoomTypeDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Room types retrieved successfully' })
  findAll(@Param('lodgingId', ParseUUIDPipe) lodgingId: string) {
    return this.lodgingRoomTypesService.findByLodging(lodgingId);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Room type retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Room type not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lodgingRoomTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Room type updated successfully' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateLodgingRoomTypeDto: UpdateLodgingRoomTypeDto) {
    return this.lodgingRoomTypesService.update(id, updateLodgingRoomTypeDto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Room type deleted successfully' })
  @ApiBadRequestResponse({ description: 'Room type not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.lodgingRoomTypesService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOkResponse({ description: 'Room type permanently deleted successfully' })
  @ApiBadRequestResponse({ description: 'Room type not found' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.lodgingRoomTypesService.delete(id);
  }
}
