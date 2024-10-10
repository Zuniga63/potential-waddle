import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Geometry, In, Repository } from 'typeorm';
import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';

import { PlaceDetailDto, PlaceDto } from './dto';
import { CloudinaryPresets } from 'src/config';
import { Place, PlaceImage } from './entities';
import { generatePlaceQueryFilters } from './utils';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceFiltersDto } from './dto/place-filters.dto';
import { Category, Facility, ImageResource } from '../core/entities';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities';
import { PlaceReviewsService } from '../reviews/services';

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

    private readonly placeReviewService: PlaceReviewsService,
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
      preset: CloudinaryPresets.PLACE_IMAGE,
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

  async findAll(filters: PlaceFiltersDto = {}, user: User | null = null) {
    const { where, order } = generatePlaceQueryFilters(filters);
    const relations: FindOptionsRelations<Place> = {
      town: { department: true },
      reviews: true,
      categories: { icon: true },
      images: { imageResource: true },
    };

    const [places, reviews] = await Promise.all([
      this.placeRepo.find({ relations, order, where }),
      user ? this.placeReviewService.getUserReviews({ userId: user.id }) : Promise.resolve<Review[]>([]),
    ]);

    return places.map(place => {
      const review = reviews.find(r => r.place.id === place.id);
      return new PlaceDto(place, review?.id);
    });
  }

  async findOne(identifier: string, user: User | null = null) {
    const relations: FindOptionsRelations<Place> = {
      categories: { icon: true },
      facilities: true,
      town: { department: true },
      images: { imageResource: true },
    };

    let place = await this.placeRepo.findOne({
      where: { slug: identifier },
      relations,
      order: { images: { order: 'ASC' } },
    });
    if (!place) place = await this.placeRepo.findOne({ where: { id: identifier }, relations });
    if (!place) throw new NotFoundException('Place not found');

    const review = user ? await this.placeReviewService.findUserReview({ userId: user.id, placeId: place.id }) : null;
    return new PlaceDetailDto({ place, reviewId: review?.id });
  }

  update(id: number, updatePlaceDto: UpdatePlaceDto) {
    return { id, ...updatePlaceDto };
  }

  remove(id: number) {
    return `This action removes a #${id} place`;
  }
}
