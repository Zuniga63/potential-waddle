import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Review } from './review.entity';
import { ReviewStatusEnum } from '../enums';
import { ImageResource } from 'src/modules/core/entities';

@Entity({ name: 'review_image' })
export class ReviewImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Review, review => review.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @OneToOne(() => ImageResource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'image_id' })
  image: ImageResource;

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('enum', { enum: ReviewStatusEnum, default: ReviewStatusEnum.PENDING })
  status: ReviewStatusEnum;
}
