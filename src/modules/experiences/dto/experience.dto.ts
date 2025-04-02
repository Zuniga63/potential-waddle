import { AppIconDto, CategoryDto, FacilityDto } from 'src/modules/core/dto';
import { Experience } from '../entities';
import { TownDto } from 'src/modules/towns/dto';
import { ExperienceGuide } from '../interfaces';
import { GuideDto } from 'src/modules/guides/dto/guide.dto';

export class ExperienceDto {
  id: string;

  title: string;

  slug: string;

  description: string;

  difficultyLevel: string;

  price: number;

  departure: {
    description?: string;
    longitude: number;
    latitude: number;
  };

  arrival: {
    description?: string;
    longitude: number;
    latitude: number;
  };

  travelTime: number;

  totalDistance: number;

  rating: number;

  points: number;

  reviews: number;

  minAge?: number;

  maxAge?: number;

  minParticipants?: number;

  maxParticipants?: number;

  recommendations?: string;

  howToDress?: string;

  restrictions?: string;

  categories?: CategoryDto[];

  facilities?: FacilityDto[];

  images?: string[];

  town?: TownDto;

  icon?: AppIconDto;

  guides: ExperienceGuide[];

  guide?: GuideDto;

  paymentMethods?: string[];

  isPublic: boolean;
  constructor({ data }: { data: Experience }) {
    if (!data) return;

    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.description = data.description;
    this.difficultyLevel = data.difficultyLevel;
    this.price = data.price;
    this.departure = {
      description: data.departureDescription || undefined,
      longitude: data.departureLocation.coordinates[0],
      latitude: data.departureLocation.coordinates[1],
    };
    this.arrival = {
      description: data.arrivalDescription || undefined,
      longitude: data.arrivalLocation.coordinates[0],
      latitude: data.arrivalLocation.coordinates[1],
    };
    this.guide = data.guide ? new GuideDto({ data: data.guide }) : undefined;
    this.travelTime = data.travelTime || 0;
    this.totalDistance = data.totalDistance || 0;
    this.rating = data.rating;
    this.points = data.points;
    this.reviews = data.reviews?.length || 0;
    this.minAge = data.minAge || undefined;
    this.maxAge = data.maxAge || undefined;
    this.minParticipants = data.minParticipants || undefined;
    this.maxParticipants = data.maxParticipants || undefined;
    this.recommendations = data.recommendations || undefined;
    this.howToDress = data.howToDress || undefined;
    this.restrictions = data.restrictions || undefined;
    this.categories = data.categories?.map(category => new CategoryDto(category));
    this.facilities = data.facilities?.map(facility => new FacilityDto(facility));
    this.images = data.images?.map(image => image.imageResource.url) || [];
    this.guides = data.guides || [];

    this.town = new TownDto(data.town);
    this.isPublic = data.isPublic;
    this.paymentMethods = data.paymentMethods || [];
  }
}
