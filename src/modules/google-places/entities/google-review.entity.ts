import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity()
@Index(['entityType', 'entityId'])
export class GoogleReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_type' })
  entityType: 'lodging' | 'restaurant' | 'commerce';

  @Column({ name: 'author_name', nullable: true })
  authorName: string;

  @Column('float', { nullable: true })
  rating: number;

  @Column('text', { nullable: true })
  text: string;

  @Column({ name: 'review_url', nullable: true })
  reviewUrl: string;

  @Column({ name: 'review_date', nullable: true })
  reviewDate: Date;

  @Column({ name: 'review_id', nullable: true })
  reviewId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'pinecone_id', nullable: true })
  pineconeId: string;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
