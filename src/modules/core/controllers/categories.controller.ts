import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  ParseBoolPipe,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { CreateCategoryDto } from '../dto';
import { CategoriesService } from '../services';
import { ModelsEnum } from '../enums';
import { PublicCategoryDto } from '../dto/categories';

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
