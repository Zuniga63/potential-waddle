import { Controller, Get, Param } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';

@Controller('experiences')
@ApiTags(SwaggerTags.Experiences)
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  findAll() {
    return this.experiencesService.findAll();
  }

  @Get(':identifier')
  findOne(@Param('identifier') id: string) {
    return this.experiencesService.findOne(id);
  }
}
