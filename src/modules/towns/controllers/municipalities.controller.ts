import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiNotImplementedResponse, ApiTags } from '@nestjs/swagger';

import { SwaggerTags } from 'src/config';
import { CreateMunicipalityDto, UpdateMunicipalityDto } from '../dto';
import { MunicipalitiesService } from '../services/municipalities.service';

@Controller('municipalities')
@ApiTags(SwaggerTags.Municipality)
export class MunicipalitiesController {
  constructor(private readonly municipalitiesServices: MunicipalitiesService) {}

  @Post()
  create(@Body() createMunicipalityDto: CreateMunicipalityDto) {
    return this.municipalitiesServices.create(createMunicipalityDto);
  }

  @Get()
  findAll() {
    return this.municipalitiesServices.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.municipalitiesServices.findOne(id);
  }

  @Patch(':id')
  @ApiNotImplementedResponse({ description: 'This endpoint is not implemented yet' })
  update(@Param('id') id: string, @Body() updateMunicipalityDto: UpdateMunicipalityDto) {
    return this.municipalitiesServices.update(id, updateMunicipalityDto);
  }

  @Delete(':id')
  @ApiNotImplementedResponse({ description: 'This endpoint is not implemented yet' })
  remove(@Param('id') id: string) {
    return this.municipalitiesServices.remove(id);
  }
}
