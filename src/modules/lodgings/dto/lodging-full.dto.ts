import { ApiProperty } from '@nestjs/swagger';
import { FacilityDto, CategoryDto } from 'src/modules/core/dto';
import { Lodging } from '../entities';
import { PlaceDto } from 'src/modules/places/dto';
import { LodgingRoomTypeDto } from './lodging-room-type.dto';
import { LodgingImageDto } from './lodging-image.dto';
import { TownDto } from 'src/modules/towns/dto';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class LodgingFullDto {
  @ApiProperty({
    example: '624013aa-9555-4a69-bf08-30cf990c56dd',
    description: 'The UUID of the place',
    readOnly: true,
  })
  id: string;

  @ApiProperty({
    type: TownDto,
    readOnly: true,
    required: false,
  })
  town?: TownDto;

  @ApiProperty({
    example: 'San Rafael',
    description: 'The name of the lodging',
  })
  name: string;

  @ApiProperty({
    example: 'san-rafael',
    description: 'The slug of the lodging',
  })
  slug: string;

  @ApiProperty({
    description: 'List of categories of the lodging',
    readOnly: true,
    required: false,
    type: CategoryDto,
    isArray: true,
  })
  categories: CategoryDto[];

  @ApiProperty({
    description: 'List of images of the lodging with full details',
    readOnly: true,
    required: false,
    type: LodgingImageDto,
    isArray: true,
  })
  images: LodgingImageDto[];

  @ApiProperty({
    example: 'This is a description',
    description: 'The description of the lodging',
  })
  description: string;

  @ApiProperty({
    example: 13,
    description: 'The review counts of the lodging',
    readOnly: true,
    required: false,
  })
  reviewsCount: number;

  @ApiProperty({
    example: 100,
    description: 'Score awarded for reaching the lodging, on a scale from 1 to 100',
    readOnly: true,
    required: false,
  })
  points: number;

  @ApiProperty({
    example: 4.5,
    description: 'Rating of the lodging, on a scale from 1 to 5',
    readOnly: true,
    required: false,
  })
  rating: number;

  @ApiProperty({
    example: 4,
    description: 'The number of rooms of the lodging',
    readOnly: true,
    required: false,
  })
  rooms: number;

  @ApiProperty({
    description: 'Minimum price of the lodging',
    readOnly: true,
    required: false,
    example: 10_000,
  })
  lowestPrice?: number;

  @ApiProperty({
    description: 'Maximum price of the lodging',
    readOnly: true,
    required: false,
    example: 100_000,
  })
  highestPrice?: number;

  @ApiProperty({
    description: 'Indicates if the current user has review',
    example: 'uuid of the review',
    readOnly: true,
    required: false,
  })
  userReview?: string;

  @ApiProperty({
    example: '08:00-18:00',
    description: 'The opening hours of the lodging',
    readOnly: true,
    required: false,
  })
  openingHours?: string[];

  @ApiProperty({
    example: 1340,
    description: 'The distance from the urban center of the town to the place',
    readOnly: true,
    required: false,
  })
  urbanCenterDistance: number;

  @ApiProperty({
    example: 'uuid of the user',
    description: 'The UUID of the user',
    readOnly: true,
    required: false,
  })
  user?: UserDto;

  @ApiProperty({
    example: true,
    description: 'Indicates if the lodging is public',
    readOnly: true,
    required: false,
  })
  isPublic: boolean;

  @ApiProperty({
    example: 123.456,
    description: 'Latitude of the lodging',
    required: false,
  })
  latitude: number;

  @ApiProperty({
    example: 123.456,
    description: 'Longitude of the lodging',
    required: false,
  })
  longitude: number;

  @ApiProperty({
    example: '123456789',
    description: 'Whatsapp number of the lodging',
    required: false,
  })
  whatsappNumbers: string[];

  @ApiProperty({
    description: 'List of facilities of the lodging',
    readOnly: true,
    required: false,
    type: FacilityDto,
    isArray: true,
  })
  facilities: FacilityDto[];

  @ApiProperty({
    example: ['WiFi', 'Parking', 'Pool'],
    description: 'List of amenities of the lodging',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  amenities: string[];

  @ApiProperty({
    example: ['Single', 'Double', 'Triple'],
    description: 'List of room types of the lodging (legacy field)',
    readOnly: true,
    required: false,
    type: 'string',
    isArray: true,
  })
  roomTypes: string[];

  @ApiProperty({
    description: 'List of detailed room types of the lodging',
    readOnly: true,
    required: false,
    type: LodgingRoomTypeDto,
    isArray: true,
  })
  lodgingRoomTypes: LodgingRoomTypeDto[];

  @ApiProperty({
    example: '123 Main St',
    description: 'The address of the lodging',
    required: false,
  })
  address?: string;

  @ApiProperty({
    example: ['123456789', '987654321'],
    description: 'List of phones of the lodging',
    required: false,
  })
  phoneNumbers?: string[];

  @ApiProperty({
    example: 'example@example.com',
    description: 'The email of the lodging',
    required: false,
  })
  email?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'The website of the lodging',
    required: false,
  })
  website?: string;

  @ApiProperty({
    example: 'https://facebook.com/example',
    description: 'The Facebook URL of the lodging',
    required: false,
  })
  facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com/example',
    description: 'The Instagram URL of the lodging',
    required: false,
  })
  instagram?: string;

  @ApiProperty({
    example: ['English', 'Spanish'],
    description: 'List of languages spoken in the lodging',
    required: false,
  })
  languages?: string[];

  @ApiProperty({
    example: 'https://goo.gl/maps/123',
    description: 'The Google Maps URL of the place',
    required: false,
  })
  googleMapsUrl?: string;

  @ApiProperty({
    example: 'How to get there',
    description: 'The way to get to the place',
    required: false,
  })
  howToGetThere?: string;

  @ApiProperty({
    example: 'Arrival reference',
    description: 'The arrival reference of the place',
    required: false,
  })
  arrivalReference?: string;

  @ApiProperty({
    example: ['cash', 'card'],
    description: 'Payment methods',
    required: false,
  })
  paymentMethods?: string[];

  @ApiProperty({
    example: 10,
    description: 'Capacity of the lodging',
    required: false,
  })
  capacity?: number;

  @ApiProperty({
    example: 4.7,
    description: 'Google Maps rating of the lodging',
    required: false,
  })
  googleMapsRating?: number;

  @ApiProperty({
    example: 253,
    description: 'Number of reviews on Google Maps',
    required: false,
  })
  googleMapsReviewsCount?: number;

  @ApiProperty({
    example: true,
    description: 'Whether to show Google Maps reviews',
    required: false,
  })
  showGoogleMapsReviews?: boolean;

  @ApiProperty({
    example: [],
    description: 'List of places associated with the lodging',
    required: false,
    type: PlaceDto,
    isArray: true,
  })
  places?: PlaceDto[];

  constructor(lodging?: Lodging, userReview?: string) {
    if (!lodging) return;

    // Basic fields from LodgingIndexDto
    this.id = lodging.id;
    this.town = new TownDto(lodging.town);
    this.name = lodging.name;
    this.slug = lodging.slug;
    this.categories = lodging.categories.map(category => new CategoryDto(category));
    this.description = lodging.description || '';
    this.reviewsCount = 0;
    this.points = lodging.points;
    this.rooms = lodging.roomCount;
    this.rating = lodging.rating;
    this.googleMapsUrl = lodging.googleMapsUrl || undefined;
    this.googleMapsRating = lodging.googleMapsRating || undefined;
    this.googleMapsReviewsCount = lodging.googleMapsReviewsCount || undefined;
    this.showGoogleMapsReviews = lodging.showGoogleMapsReviews;
    this.user = new UserDto(lodging.user);
    this.lowestPrice = lodging.lowestPrice || undefined;
    this.highestPrice = lodging.highestPrice || undefined;
    this.userReview = userReview;
    this.openingHours = lodging.openingHours || undefined;
    this.urbanCenterDistance = lodging.urbanCenterDistance || 0;
    this.isPublic = lodging.isPublic;
    this.longitude = lodging.location?.coordinates[0] || 0;
    this.latitude = lodging.location?.coordinates[1] || 0;
    this.whatsappNumbers = lodging.whatsappNumbers || [];

    // Full DTO specific fields
    this.facilities = lodging.facilities?.map(facility => new FacilityDto(facility)) || [];
    this.amenities = lodging.amenities || [];
    this.roomTypes = lodging.roomTypes || [];
    this.lodgingRoomTypes = lodging.lodgingRoomTypes?.map(roomType => new LodgingRoomTypeDto(roomType)) || [];
    this.address = lodging.address || undefined;
    this.phoneNumbers = lodging.phoneNumbers || [];
    this.email = lodging.email || undefined;
    this.website = lodging.website || undefined;
    this.facebook = lodging.facebook || undefined;
    this.instagram = lodging.instagram || undefined;
    this.languages = lodging.spokenLanguages;
    this.howToGetThere = lodging.howToGetThere || undefined;
    this.arrivalReference = lodging.arrivalReference || undefined;
    this.paymentMethods = lodging.paymentMethods || [];
    this.capacity = lodging.capacity || undefined;
    this.images = lodging.images
      .filter(image => image.imageResource != null)
      .sort((a, b) => a.order - b.order)
      .map(image => new LodgingImageDto(image));
    this.places = lodging.places?.map(lodgingPlace => new PlaceDto(lodgingPlace.place)) || [];
  }
}
