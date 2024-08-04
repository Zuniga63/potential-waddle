import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  NotImplementedException,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SwaggerTags } from 'src/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFileValidationPipe } from '../common/pipes';
import { PlaceDto } from './dto';

@Controller('places')
@ApiTags(SwaggerTags.Places)
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new place' })
  @UseInterceptors(FileInterceptor('imageFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'The place has been successfully created.', type: PlaceDto })
  create(
    @Body() createPlaceDto: CreatePlaceDto,
    @UploadedFile(new ImageFileValidationPipe({ propertyName: 'imageFile' })) image: Express.Multer.File,
  ) {
    return this.placesService.create({ ...createPlaceDto, imageFile: image });
  }

  @Get()
  findAll() {
    return this.placesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto) {
    return this.placesService.update(+id, updatePlaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.placesService.remove(+id);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(new ImageFileValidationPipe({ propertyName: 'image' })) image: Express.Multer.File,
  ) {
    console.log(id, image);
    throw new NotImplementedException('This action adds a new place image');
  }

  @Delete(':id/image/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    console.log(id, imageId);
    throw new NotImplementedException('This action removes a place image');
  }

  @Post(':id/reviews')
  createReview(@Param('id') id: string, @Body() review: string) {
    console.log(id, review);
    throw new NotImplementedException('This action creates a new place review');
  }

  @Get(':id/reviews')
  getReviews(@Param('id') id: string) {
    console.log(id);
    throw new NotImplementedException('This action returns all place reviews');
  }

  @Patch(':id/reviews/:reviewId')
  updateReview(@Param('id') id: string, @Param('reviewId') reviewId: string, @Body() review: string) {
    console.log(id, reviewId, review);
    throw new NotImplementedException('This action updates a place review');
  }
}
