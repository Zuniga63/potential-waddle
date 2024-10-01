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
import { CreateCategoryDto } from '../dto';
import { CategoriesService } from '../services';
import { ModelsEnum } from '../enums';

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
    return this.categoriesService.findAll({ modelId, innerJoin });
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
