import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateFacilityDto } from '../dto';
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
    name: 'model-id',
    required: false,
    description: 'UUID model: Retrieves the model categories along with the general categories.',
    type: String,
  })
  @ApiQuery({
    name: 'inner-join',
    required: false,
    enum: ModelsEnum,
    description:
      'Retrieves the categories assigned to the model. This parameter takes precedence over the model-id parameter.',
  })
  findAll(
    @Query('model-id', new ParseUUIDPipe({ optional: true })) modelId?: string,
    @Query('inner-join', new ParseEnumPipe(ModelsEnum, { optional: true })) innerJoin?: ModelsEnum,
  ) {
    return this.facilitiesService.findAll({ modelId, innerJoin });
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
