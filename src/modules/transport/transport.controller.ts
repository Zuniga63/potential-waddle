import { Controller, Get, Post, Patch, Param, Delete, Body, ParseUUIDPipe } from '@nestjs/common';
import { TransportService } from './transport.service';
import { SwaggerTags } from 'src/config';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TransportFiltersDto } from './dto';
import { TransportFilters } from './decorators';
import { TransportListQueryDocsGroup } from './decorators/transport-list-query-docs-group.decorator';
import { TransportDto } from './dto/transport.dto';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';

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
  create(@Body() createTransportDto: CreateTransportDto) {
    console.log(createTransportDto);
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
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTransportDto: UpdateTransportDto) {
    return this.transportService.update(id, updateTransportDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE TRANSPORT
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transport', deprecated: true })
  remove(@Param('id') id: string) {
    return this.transportService.remove(id);
  }
}
