import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { DocumentService } from '../services';
import { CreateDocumentDto, UpdateDocumentStatusDto, DocumentResponseDto, EntityDocumentStatusDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { GetUser } from '../../common/decorators';
import { User } from '../../users/entities';
import { DocumentEntityType } from '../enums';
import { TENANT_ID_KEY } from '../../tenant/tenant.interceptor';

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @Auth()
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentTypeId: { type: 'string', format: 'uuid' },
        entityType: { type: 'string', enum: Object.values(DocumentEntityType) },
        entityId: { type: 'string', format: 'uuid' },
        expirationDate: { type: 'string', format: 'date', nullable: true },
      },
      required: ['file', 'documentTypeId', 'entityType', 'entityId'],
    },
  })
  @ApiOkResponse({ type: DocumentResponseDto })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateDocumentDto,
    @GetUser() user: User,
    @Req() request: Request,
  ) {
    const townId = (request as any)[TENANT_ID_KEY];
    return this.documentService.uploadDocument(createDto, file, user.id, townId);
  }

  @Get('entity/:entityType/:entityId')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all documents for an entity' })
  @ApiOkResponse({ type: [DocumentResponseDto] })
  findByEntity(
    @Param('entityType') entityType: DocumentEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.documentService.findByEntity(entityType, entityId);
  }

  @Get('entity/:entityType/:entityId/status')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document status for an entity with all requirements' })
  @ApiOkResponse({ type: [EntityDocumentStatusDto] })
  getEntityDocumentStatus(
    @Param('entityType') entityType: DocumentEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Req() request: Request,
  ) {
    const townId = (request as any)[TENANT_ID_KEY];
    return this.documentService.getEntityDocumentStatus(townId, entityType, entityId);
  }

  @Get('entity/:entityType/:entityId/check')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if entity has all required documents' })
  hasAllRequiredDocuments(
    @Param('entityType') entityType: DocumentEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Req() request: Request,
  ) {
    const townId = (request as any)[TENANT_ID_KEY];
    return this.documentService.hasAllRequiredDocuments(townId, entityType, entityId);
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiOkResponse({ type: DocumentResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.findOne(id);
  }

  @Patch(':id/status')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document status (approve/reject)' })
  @ApiOkResponse({ type: DocumentResponseDto })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentStatusDto,
    @GetUser() user: User,
  ) {
    return this.documentService.updateStatus(id, updateDto, user.id);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentService.remove(id);
  }
}
