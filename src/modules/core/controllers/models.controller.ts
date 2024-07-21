import { Body, Controller, Delete, Get, HttpStatus, NotImplementedException, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateModelDto } from '../dto';
import { ModelsService } from '../services';

@Controller('models')
@ApiTags(SwaggerTags.Models)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}
  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Post()
  create(@Body() createModelDto: CreateModelDto) {
    return this.modelsService.create(createModelDto);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL MODELS
  // * -------------------------------------------------------------------------------------------------------------
  @Get()
  findAll() {
    return this.modelsService.findAll();
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET MODEL BY ID
  // * -------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  findOne() {
    throw new NotImplementedException('This action is not implemented');
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  update() {
    throw new NotImplementedException('This action is not implemented');
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  remove() {
    throw new NotImplementedException('This action is not implemented');
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * ADD CATEGORY TO MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id/categories/:categoryId')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  addCategory() {
    throw new NotImplementedException('This action is not implemented');
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * REMOVE CATEGORY FROM MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id/categories/:categoryId')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  removeCategory() {
    throw new NotImplementedException('This action is not implemented');
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * ADD FACILITY TO MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id/facilities/:facilityId')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  addFacility() {
    throw new NotImplementedException('This action is not implemented');
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * REMOVE FACILITY FROM MODEL
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id/facilities/:facilityId')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  removeFacility() {
    throw new NotImplementedException('This action is not implemented');
  }
}
