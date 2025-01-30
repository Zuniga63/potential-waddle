import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { CreateCommerceDto } from './dto/create-commerce.dto';
import { UpdateCommerceDto } from './dto/update-commerce.dto';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CommerceListQueryParamsDocs } from './decorators/commerce-list-query-params-docs.decorator';
import { CommerceIndexDto } from './dto/commerce-index.dto';
import { CommerceFiltersDto } from './dto';
import { CommerceFilters } from './decorators/commerce-filters.decorator';
import { SwaggerTags } from 'src/config';

@Controller('commerce')
@ApiTags(SwaggerTags.Commerce)
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Post()
  create(@Body() createCommerceDto: CreateCommerceDto) {
    return this.commerceService.create(createCommerceDto);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL COMMERCES
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @CommerceListQueryParamsDocs()
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce List', type: [CommerceIndexDto] })
  findAll(@CommerceFilters() filters: CommerceFiltersDto) {
    return this.commerceService.findAll({ filters });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ONE COMMERCE
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commerceService.findOne({ identifier: id });
  }

  @Patch(':id')
  update(@Param('identifier') identifier: string, @Body() updateCommerceDto: UpdateCommerceDto) {
    return this.commerceService.update({ identifier }, updateCommerceDto);
  }

  @Delete(':id')
  remove(@Param('identifier') identifier: string) {
    return this.commerceService.remove({ identifier });
  }
}
