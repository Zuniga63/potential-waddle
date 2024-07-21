import { Body, Controller, Delete, Get, HttpStatus, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateFacilityDto } from '../dto';
import { FacilitiesService } from '../services';

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
  @ApiQuery({ name: 'modelId', required: false })
  findAll(@Query('modelId', new ParseUUIDPipe({ optional: true })) modelId?: string) {
    return this.facilitiesService.findAll({ modelId });
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET FACILITY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  findOne() {
    return 'This action returns a model by ID';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  update() {
    return 'This action updates a category';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE FACILITY
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  remove() {
    return 'This action removes a category';
  }
}
