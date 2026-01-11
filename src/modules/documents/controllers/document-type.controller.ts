import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentTypeService } from '../services';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto, DocumentTypeResponseDto } from '../dto';
import { Auth } from '../../auth/decorators';

@ApiTags('Document Types')
@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Post()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new document type (Super Admin only)' })
  @ApiOkResponse({ type: DocumentTypeResponseDto })
  create(@Body() createDto: CreateDocumentTypeDto) {
    return this.documentTypeService.create(createDto);
  }

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all document types' })
  @ApiOkResponse({ type: [DocumentTypeResponseDto] })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.documentTypeService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a document type by ID' })
  @ApiOkResponse({ type: DocumentTypeResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypeService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a document type' })
  @ApiOkResponse({ type: DocumentTypeResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateDocumentTypeDto) {
    return this.documentTypeService.update(id, updateDto);
  }

  @Patch(':id/toggle-active')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle document type active status' })
  @ApiOkResponse({ type: DocumentTypeResponseDto })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypeService.toggleActive(id);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document type' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypeService.remove(id);
  }
}
