import { Controller, ParseBoolPipe, ParseEnumPipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileDto } from './dto';
import { FileSheetsEnum } from './enums';

@Controller('seeds')
@ApiTags(SwaggerTags.Seeds)
export class SeedsController {
  constructor(private readonly seedsService: SeedsService) {}

  @Post()
  create() {
    return this.seedsService.create();
  }

  @Post('from-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Seed the data from this template https://docs.google.com/spreadsheets/d/1bPjJWa1hM7zurExoXRqW1FNht5_J1GF0/edit?gid=701236842#gid=701236842.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileDto })
  @ApiQuery({ name: 'truncate', required: false, type: Boolean })
  @ApiQuery({ name: 'sheet', required: false, enum: FileSheetsEnum })
  seedFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('truncate', new ParseBoolPipe({ optional: true })) truncate?: boolean,
    @Query('sheet', new ParseEnumPipe(FileSheetsEnum, { optional: true })) sheet?: FileSheetsEnum,
  ) {
    return this.seedsService.seedFromFile(file, truncate, sheet);
  }
}
