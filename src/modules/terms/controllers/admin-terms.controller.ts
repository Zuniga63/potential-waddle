import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SuperAdmin } from 'src/modules/auth/decorators';
import { GetUser } from 'src/modules/common/decorators';
import { User } from 'src/modules/users/entities';
import { SwaggerTags } from 'src/config';

import { TermsService } from '../services';
import {
  AdminAcceptancesFiltersDto,
  AdminAcceptancesListDto,
  AdminTermsDocumentDto,
  AdminTermsListDto,
  CreateAdminTermsDto,
  UpdateAdminTermsDto,
} from '../dto';

@Controller('admin/terms')
@ApiTags(SwaggerTags.Terms)
@SuperAdmin()
export class AdminTermsController {
  constructor(private readonly termsService: TermsService) {}

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET ALL DOCUMENTS (active + inactive across all 6 types) WITH ACCEPTANCE COUNTS
  // * ----------------------------------------------------------------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'Admin — list all T&C documents with acceptance counts' })
  @ApiOkResponse({ type: AdminTermsListDto })
  list(): Promise<AdminTermsListDto> {
    return this.termsService.adminFindAll();
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * CREATE — markdown via JSON OR PDF via multipart/form-data
  // * ----------------------------------------------------------------------------------------------------------------
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Admin — create a new T&C document (markdown JSON or PDF multipart)',
    description:
      'JSON body: { type, format: "markdown", content }. ' +
      'multipart/form-data: { type, format: "pdf", file }. ' +
      'Created documents start as inactive — call POST /admin/terms/:id/activate separately.',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: CreateAdminTermsDto })
  @ApiOkResponse({ type: AdminTermsDocumentDto })
  async create(
    @Body() body: CreateAdminTermsDto,
    @GetUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AdminTermsDocumentDto> {
    return this.termsService.adminCreate({
      type: body.type,
      format: body.format,
      content: body.content,
      file,
      creator: user,
    });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * UPDATE — markdown via JSON OR PDF replace via multipart
  // * ----------------------------------------------------------------------------------------------------------------
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Admin — update an existing T&C document (does not affect existing acceptances)' })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: UpdateAdminTermsDto })
  @ApiOkResponse({ type: AdminTermsDocumentDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAdminTermsDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AdminTermsDocumentDto> {
    return this.termsService.adminUpdate(id, {
      content: body.content,
      format: body.format,
      file,
    });
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * ACTIVATE — atomic deactivate-previous + activate-this for the doc's type
  // * ----------------------------------------------------------------------------------------------------------------
  @Post(':id/activate')
  @ApiOperation({ summary: 'Admin — activate a T&C document (deactivates the previous active of the same type)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        deactivatedPreviousId: { type: 'string', nullable: true, example: '624013aa-...' },
      },
    },
  })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.termsService.adminActivate(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * DELETE — rejected with 409 if active or has acceptances
  // * ----------------------------------------------------------------------------------------------------------------
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin — delete a T&C document (rejected if active or has acceptances)' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.termsService.adminDelete(id);
  }

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET PAGINATED ACCEPTANCES FOR A DOCUMENT
  // * ----------------------------------------------------------------------------------------------------------------
  @Get(':id/acceptances')
  @ApiOperation({ summary: 'Admin — paginated acceptance log for a T&C document' })
  @ApiOkResponse({ type: AdminAcceptancesListDto })
  acceptances(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: AdminAcceptancesFiltersDto,
  ): Promise<AdminAcceptancesListDto> {
    return this.termsService.adminGetAcceptances(id, filters.page, filters.pageSize);
  }
}
