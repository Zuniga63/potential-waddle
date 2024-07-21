import { Body, Controller, Delete, Get, HttpStatus, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateCategoryDto } from '../dto';
import { CategoriesService } from '../services';

@Controller('categories')
@ApiTags(SwaggerTags.Categories)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}
  // * -------------------------------------------------------------------------------------------------------------
  // * CREATE NEW CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  @Get()
  @ApiQuery({ name: 'modelId', required: false })
  findAll(@Query('modelId', new ParseUUIDPipe({ optional: true })) modelId?: string) {
    return this.categoriesService.findAll({ modelId });
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET CATEGORY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  findOne() {
    return 'This action returns a model by ID';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  update() {
    return 'This action updates a category';
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'This endpoint is currently disabled' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'This endpoint is disabled' })
  remove() {
    return 'This action removes a category';
  }
}
