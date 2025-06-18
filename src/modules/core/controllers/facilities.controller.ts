import { Body, Controller, Delete, Get, HttpStatus, ParseEnumPipe, Patch, Post, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateFacilityDto, UpdateFacilityDto } from '../dto';
import { FacilitiesService } from '../services';
import { ModelsEnum } from '../enums';

@Controller('facilities')
@ApiTags(SwaggerTags.Facilities)
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}
  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  @Post()
  create(@Body() createFacilityDto: CreateFacilityDto) {
    return this.facilitiesService.create(createFacilityDto);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  @Get()
  @ApiQuery({
    name: 'slug',
    required: false,
    description: 'Slug model: Retrieves the model facilities along with the general facilities.',
    type: String,
  })
  @ApiQuery({
    name: 'inner-join',
    required: false,
    enum: ModelsEnum,
    description:
      'Retrieves the categories assigned to the model. This parameter takes precedence over the slug parameter.',
  })
  findAll(
    @Query('slug') slug?: string,
    @Query('inner-join', new ParseEnumPipe(ModelsEnum, { optional: true })) innerJoin?: ModelsEnum,
  ) {
    return this.facilitiesService.findAll({ slug, innerJoin });
  }

  @Get('full')
  findAllFull() {
    return this.facilitiesService.findAllFull();
  }

  // * -------------------------------------------------------------------------------------------------------------
  // * GET FACILITY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get facility by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Facility retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Facility not found' })
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findOne(id);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Update facility by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Facility updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Facility not found' })
  update(@Param('id') id: string, @Body() updateFacilityDto: UpdateFacilityDto) {
    return this.facilitiesService.update(id, updateFacilityDto);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Facility deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Facility not found' })
  remove(@Param('id') id: string) {
    return this.facilitiesService.remove(id);
  }
}
