import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { CreateCommerceDto } from './dto/create-commerce.dto';
import { UpdateCommerceDto } from './dto/update-commerce.dto';

@Controller('commerce')
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Post()
  create(@Body() createCommerceDto: CreateCommerceDto) {
    return this.commerceService.create(createCommerceDto);
  }

  @Get()
  findAll() {
    return this.commerceService.findAll();
  }

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
