import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';

import { SwaggerTags } from 'src/config';
import { OptionalAuth } from '../auth/decorators';

import { ExperiencesService } from './experiences.service';
import { ExperienceFiltersDto } from './dto';
import { ExperienceFilters, ExperienceListApiQueries } from './decorators';

@Controller(SwaggerTags.Experiences)
@ApiTags(SwaggerTags.Experiences)
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  @OptionalAuth()
  @ExperienceListApiQueries()
  findAll(@ExperienceFilters() filters: ExperienceFiltersDto) {
    return this.experiencesService.findAll({ filters });
  }

  @Get(':identifier')
  findOne(@Param('identifier') id: string) {
    return this.experiencesService.findOne(id);
  }
}
