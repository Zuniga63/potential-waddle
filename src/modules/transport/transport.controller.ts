import { Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { TransportService } from './transport.service';
import { SwaggerTags } from 'src/config';
import { ApiTags } from '@nestjs/swagger';
import { TransportFiltersDto } from './dto';
import { TransportFilters } from './decorators';

@Controller('transport')
@ApiTags(SwaggerTags.Transport)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post()
  create() {
    return this.transportService.create();
  }

  @Get()
  findAll(@TransportFilters() filters: TransportFiltersDto) {
    return this.transportService.findAll({ filters });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.transportService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transportService.remove(+id);
  }
}
