import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config/swagger-tags.enum';
import { Promotion } from './entities/promotion.entity';

@Controller('promotions')
@ApiTags(SwaggerTags.Promotions)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new promotion' })
  @ApiCreatedResponse({
    description: 'The promotion has been successfully created.',
    type: Promotion,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entityId: {
          type: 'string',
          example: '12345',
          description: 'The entity ID that this promotion belongs to',
        },
        entityType: {
          type: 'string',
          enum: ['lodging', 'restaurant', 'experience', 'guide'],
          example: 'lodging',
          description: 'The type of entity this promotion belongs to',
        },
        name: {
          type: 'string',
          example: 'Summer Special Discount',
          description: 'The name of the promotion',
        },
        description: {
          type: 'string',
          example: 'Get 20% off your stay during summer months',
          description: 'The description of the promotion',
        },
        validFrom: {
          type: 'string',
          format: 'date-time',
          example: '2024-06-01T00:00:00Z',
          description: 'The start date of the promotion validity',
        },
        validTo: {
          type: 'string',
          format: 'date-time',
          example: '2024-08-31T23:59:59Z',
          description: 'The end date of the promotion validity',
        },
        value: {
          type: 'number',
          example: 20,
          description: 'The value of the promotion (percentage or amount)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'The image file for the promotion',
        },
      },
    },
  })
  create(@Body() createPromotionDto: CreatePromotionDto, @UploadedFile() file: Express.Multer.File) {
    return this.promotionsService.create(createPromotionDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all promotions' })
  @ApiOkResponse({
    description: 'The promotions have been successfully retrieved.',
    type: [Promotion],
  })
  findAll(
    @Query('entityId') entityId?: string,
    @Query('entityType') entityType?: 'lodging' | 'restaurant' | 'experience' | 'guide'
  ) {
    return this.promotionsService.findAll(entityId, entityType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a promotion by ID' })
  @ApiOkResponse({
    description: 'The promotion has been successfully retrieved.',
    type: Promotion,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a promotion' })
  @ApiOkResponse({
    description: 'The promotion has been successfully updated.',
    type: Promotion,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entityId: {
          type: 'string',
          example: '12345',
          description: 'The entity ID that this promotion belongs to',
        },
        entityType: {
          type: 'string',
          enum: ['lodging', 'restaurant', 'experience', 'guide'],
          example: 'lodging',
          description: 'The type of entity this promotion belongs to',
        },
        name: {
          type: 'string',
          example: 'Summer Special Discount',
          description: 'The name of the promotion',
        },
        description: {
          type: 'string',
          example: 'Get 20% off your stay during summer months',
          description: 'The description of the promotion',
        },
        validFrom: {
          type: 'string',
          format: 'date-time',
          example: '2024-06-01T00:00:00Z',
          description: 'The start date of the promotion validity',
        },
        validTo: {
          type: 'string',
          format: 'date-time',
          example: '2024-08-31T23:59:59Z',
          description: 'The end date of the promotion validity',
        },
        value: {
          type: 'number',
          example: 20,
          description: 'The value of the promotion (percentage or amount)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'The image file for the promotion (optional for updates)',
        },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.promotionsService.update(id, updatePromotionDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a promotion' })
  @ApiOkResponse({ description: 'The promotion has been successfully deleted.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.remove(id);
  }
}
