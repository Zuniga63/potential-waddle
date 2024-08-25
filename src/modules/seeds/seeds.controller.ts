import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, ParseBoolPipe, ParseEnumPipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';

import { FileDto } from './dto';
import { FileSheetsEnum } from './enums';
import { SwaggerTags } from 'src/config';
import { SeedsService } from './seeds.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('seeds')
@ApiTags(SwaggerTags.Seeds)
export class SeedsController {
  constructor(private readonly seedsService: SeedsService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Seed the data from excel file. The file should be in the format of .xlsx and should contain the required data.',
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

  @Post('truncate')
  @ApiOperation({ summary: 'Truncate all the data in the database.' })
  truncate() {
    return this.seedsService.truncateAllData();
  }
}
