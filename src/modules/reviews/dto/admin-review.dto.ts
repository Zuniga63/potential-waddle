import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatusEnum } from '../enums';
import { Review } from '../entities';

class Place {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class User {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  distanceTravelled: number;

  @ApiProperty()
  placesVisited: number;
}

export class AdminReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: User })
  user: User;

  @ApiPropertyOptional({ type: Place })
  place?: Place;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  comment?: string;

  @ApiProperty({ enum: ReviewStatusEnum })
  status: ReviewStatusEnum;

  images: {
    id: string;
    url: string;
    status: ReviewStatusEnum;
  }[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  approvedAt?: Date;

  constructor(review: Review) {
    this.id = review.id;
    this.user = {
      id: review.user?.id || '',
      username: review.user?.username || '',
      points: Math.random() * 100,
      distanceTravelled: Math.random() * 1000,
      placesVisited: Math.random() * 100,
    };

    this.place = review.place ? { id: review.place.id, name: review.place.name } : undefined;
    this.images = review.images.map(image => ({ id: image.id, url: image.image.url, status: image.status }));

    this.rating = review.rating;
    this.isPublic = review.isPublic;
    this.comment = review.comment ?? undefined;
    this.status = review.status;
    this.createdAt = review.createdAt;
  }
}
