import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { CreateCommerceDto } from './dto/create-commerce.dto';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CommerceListQueryParamsDocs } from './decorators/commerce-list-query-params-docs.decorator';
import { CommerceIndexDto } from './dto/commerce-index.dto';
import { CommerceFiltersDto } from './dto';
import { CommerceFilters } from './decorators/commerce-filters.decorator';
import { SwaggerTags } from 'src/config';
import { CommerceFullDto } from './dto/commerce-full.dto';

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
  // * GET LODGING BY IDENTIFIER
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':identifier')
  @OptionalAuth()
  @ApiOkResponse({ description: 'Commerce Detail', type: CommerceFullDto })
  findOne(@Param('identifier') identifier: string) {
    return this.commerceService.findOne({ identifier });
  }
}
