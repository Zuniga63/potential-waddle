import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FindOptionsRelations, Geometry, In, Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Place, PlaceImage } from './entities';
import { Category, Facility, ImageResource } from '../core/entities';
import { CloudinaryPresets } from 'src/config';
import { PlaceDto } from './dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepo: Repository<Place>,

    @InjectRepository(ImageResource)
    private readonly imageResourceRepo: Repository<ImageResource>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,

    @InjectRepository(PlaceImage)
    private readonly placeImageRepo: Repository<PlaceImage>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createPlaceDto: CreatePlaceDto) {
    const { imageFile: file, categoryIds, facilityIds, longitude, latitude, ...restDto } = createPlaceDto;

    // Se recuperan las instancias de categories y facility
    const categories = categoryIds ? await this.categoryRepo.findBy({ id: In(categoryIds) }) : [];
    const facilities = facilityIds ? await this.facilityRepo.findBy({ id: In(facilityIds) }) : [];

    // Se crea el objeto de ubicación en formato GeoJSON
    const location: Geometry = { type: 'Point', coordinates: [longitude, latitude] };

    const place = this.placeRepo.create({
      ...restDto,
      categories,
      facilities,
      location,
    });

    await this.placeRepo.save(place);

    // Se guarda la imagen en Cloudinary
    const cloudinaryResponse = await this.cloudinaryService.uploadImage({
      file: file,
      fileName: place.name,
      preset: CloudinaryPresets.PLACE_PHOTO,
    });

    if (!cloudinaryResponse) throw new BadGatewayException('Error uploading image');

    const image = this.imageResourceRepo.create({
      publicId: cloudinaryResponse.publicId,
      url: cloudinaryResponse.url,
      fileName: restDto.name,
      width: cloudinaryResponse.width,
      height: cloudinaryResponse.height,
      format: cloudinaryResponse.format,
      resourceType: cloudinaryResponse.type,
    });

    await this.imageResourceRepo.save(image);

    const placeImage = this.placeImageRepo.create({
      imageResource: image,
      place,
      order: 1,
    });

    await this.placeImageRepo.save(placeImage);

    place.images = [placeImage];

    return this.placeRepo.save(place);
  }

  async findAll() {
    const places = await this.placeRepo.find({
      relations: { town: { department: true }, categories: true, facilities: true, images: { imageResource: true } },
    });

    // return places;
    return places.map(place => new PlaceDto(place));
  }

  async findOne(identifier: string) {
    const relations: FindOptionsRelations<Place> = {
      categories: true,
      facilities: true,
      town: { department: true },
      images: { imageResource: true },
    };

    const placeBySlug = await this.placeRepo.findOne({ where: { slug: identifier }, relations });
    if (placeBySlug) return new PlaceDto(placeBySlug);

    const placeById = await this.placeRepo.findOne({ where: { id: identifier }, relations });
    if (placeById) return new PlaceDto(placeById);

    throw new NotFoundException('Place not found');
  }

  update(id: number, updatePlaceDto: UpdatePlaceDto) {
    return { id, ...updatePlaceDto };
  }

  remove(id: number) {
    return `This action removes a #${id} place`;
  }
}
