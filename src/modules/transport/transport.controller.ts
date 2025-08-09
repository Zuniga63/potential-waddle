import { Controller, Get, Post, Patch, Param, Delete, Body, ParseUUIDPipe } from '@nestjs/common';
import { TransportService } from './transport.service';
import { SwaggerTags } from 'src/config';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { TransportFiltersDto } from './dto';
import { TransportFilters } from './decorators';
import { TransportListQueryDocsGroup } from './decorators/transport-list-query-docs-group.decorator';
import { TransportDto } from './dto/transport.dto';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { OptionalAuth } from '../auth/decorators';
import { RestaurantDto } from '../restaurants/dto/restaurant.dto';

@Controller('transport')
@ApiTags(SwaggerTags.Transport)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE TRANSPORT
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @ApiOperation({ summary: 'Create a new transport' })
  @ApiOkResponse({ description: 'The transport has been successfully created.', type: TransportDto })
  @ApiConflictResponse({
    description: 'User already has a transport associated. Each user can only have one transport.',
  })
  create(@Body() createTransportDto: CreateTransportDto) {
    return this.transportService.create(createTransportDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL TRANSPORTS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @TransportListQueryDocsGroup()
  findAll(@TransportFilters() filters: TransportFiltersDto) {
    return this.transportService.findAll({ filters });
  }

  @Get('public')
  @TransportListQueryDocsGroup()
  findPublicTransports(@TransportFilters() filters: TransportFiltersDto) {
    return this.transportService.findPublicTransports({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET TRANSPORT BY ID
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'The UUID of the transport' })
  @ApiOkResponse({ description: 'The transport has been successfully retrieved.', type: TransportDto })
  findOne(@Param('id') id: string) {
    return this.transportService.findOne(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE TRANSPORT
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string', description: 'The UUID of the transport' })
  @ApiOkResponse({ description: 'The transport has been successfully updated.', type: TransportDto })
  @ApiConflictResponse({
    description: 'User already has a transport associated. Each user can only have one transport.',
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTransportDto: UpdateTransportDto) {
    return this.transportService.update(id, updateTransportDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE TRANSPORT
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transport' })
  remove(@Param('id') id: string) {
    return this.transportService.remove(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE TRANSPORT AVAILABILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id/availability')
  @ApiOperation({ summary: 'Update transport availability status' })
  @ApiParam({ name: 'id', type: 'string', description: 'The UUID of the transport' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isAvailable: { type: 'boolean' },
      },
    },
  })
  @ApiOkResponse({ description: 'The transport availability has been successfully updated.', type: TransportDto })
  updateAvailability(@Param('id', ParseUUIDPipe) id: string, @Body('isAvailable') isAvailable: boolean) {
    return this.transportService.updateAvailability(id, isAvailable);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE USER IN RESTAURANT
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/users/:userId')
  @OptionalAuth()
  @ApiOkResponse({ description: 'User Updated in Transport', type: RestaurantDto })
  @ApiBadRequestResponse({ description: 'The user cannot be updated in the transport' })
  @ApiConflictResponse({
    description: 'User already has a transport associated. Each user can only have one transport.',
  })
  updateUser(@Param('identifier') identifier: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.transportService.updateUser(identifier, userId);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE TRANSPORT VISIBILITY
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':identifier/visibility')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Transport Visibility Updated', type: TransportDto })
  @ApiBadRequestResponse({ description: 'The visibility cannot be updated' })
  updateVisibility(@Param('identifier') identifier: string, @Body() body: { isPublic: boolean }) {
    return this.transportService.updateVisibility(identifier, body.isPublic);
  }
}
