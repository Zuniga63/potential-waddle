import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'image_asset' })
export class ImageAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  url: string;

  @Column('text', { name: 'file_name' })
  fileName: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { name: 'description_en', nullable: true })
  description_en?: string;

  @Column('text', { name: 'public_id', nullable: true })
  publicId?: string;

  @Column('integer', { nullable: true })
  width?: number;

  @Column('integer', { nullable: true })
  height?: number;

  @Column('text', { nullable: true })
  format?: string;

  @Column('text', { nullable: true, name: 'resource_type' })
  resourceType?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
