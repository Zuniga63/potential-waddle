import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import { CategoriesService } from '../services';
import { ModelsEnum } from '../enums';
import { PublicCategoryDto, FullCategoryDto } from '../dto/categories';

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
  @ApiQuery({
    name: 'model',
    required: false,
    enum: ModelsEnum,
    description:
      'Retrieves the categories assigned to the selected model, ensuring they have at least one relationship',
  })
  @ApiQuery({
    name: 'only-enabled',
    required: false,
    type: Boolean,
    description: 'Retrieves only enabled categories, by default is true.',
  })
  @ApiQuery({
    name: 'only-asigned',
    required: false,
    type: Boolean,
    description:
      'Retrieves only the categories that have relationships with any reference model. By default, this is set to false. This query parameter is applied only when no specific model is provided, and it ensures that only categories with at least one relationship to a reference model are retrieved.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PublicCategoryDto],
    description: 'Returns a list of categories',
  })
  findAll(
    @Query('model', new ParseEnumPipe(ModelsEnum, { optional: true })) model?: ModelsEnum,
    @Query('only-enabled', new ParseBoolPipe({ optional: true })) onlyEnabled?: boolean,
    @Query('only-asigned', new ParseBoolPipe({ optional: true })) onlyAsigned?: boolean,
  ) {
    return this.categoriesService.findAll({ model, onlyEnabled, onlyAsigned });
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET ALL CATEGORIES (FULL)
  // * -------------------------------------------------------------------------------------------------------------
  @Get('full')
  @ApiOperation({ summary: 'Get all categories with complete information' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [FullCategoryDto],
    description: 'Returns all categories with complete information including all relationships',
  })
  findAllFull() {
    return this.categoriesService.findAllFull();
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * GET CATEGORY BY ID
  // * -------------------------------------------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FullCategoryDto,
    description: 'Returns the category with complete information',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * UPDATE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FullCategoryDto,
    description: 'Returns the updated category',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }
  // * -------------------------------------------------------------------------------------------------------------
  // * DELETE CATEGORY
  // * -------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category UUID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category successfully deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Category "Food" has been successfully deleted' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete category with active relationships',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
