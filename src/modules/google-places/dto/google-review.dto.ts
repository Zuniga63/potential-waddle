import { IsString, IsNotEmpty, IsNumber, IsDate } from 'class-validator';
import { GoogleReview } from '../entities/google-review.entity';

export class GoogleReviewDto {
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsNumber()
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsDate()
  @IsNotEmpty()
  reviewDate: Date;

  @IsString()
  @IsNotEmpty()
  reviewUrl: string;

  @IsString()
  @IsNotEmpty()
  reviewId: string;

  constructor({ data }: { data: GoogleReview }) {
    this.authorName = data.authorName;
    this.rating = data.rating;
    this.text = data.text;
    this.reviewUrl = data.reviewUrl;
    this.reviewId = data.reviewId;
    this.reviewDate = data.reviewDate;
  }
}
