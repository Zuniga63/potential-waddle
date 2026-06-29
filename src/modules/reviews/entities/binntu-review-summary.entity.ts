import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ReviewDomainsEnum } from '../enums/review-domains.enum';

/**
 * Persists AI-generated structured review summaries for Binntu reviews.
 *
 * `content` stores the raw JSON string returned by Gemini (StructuredReviewAnalysis shape).
 * `reviewCountAtGeneration` captures the approved+rated review count at generation time,
 * enabling the D-10 "N nuevas desde el último análisis" delta without an extra query.
 * `generatedAt` is set by the DB on INSERT via @CreateDateColumn.
 */
@Entity({ name: 'binntu_review_summary' })
@Index(['entityType', 'entityId'])
export class BinntuReviewSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'review_count_at_generation', type: 'int' })
  reviewCountAtGeneration: number;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamp' })
  generatedAt: Date;
}
