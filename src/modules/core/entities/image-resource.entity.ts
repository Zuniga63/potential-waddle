import { ResourceProvider } from 'src/config';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'image_resource' })
export class ImageResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  url: string;

  @Column('text', { name: 'file_name', nullable: true })
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

  @Column('enum', { enum: ResourceProvider, nullable: true })
  provider?: ResourceProvider;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
