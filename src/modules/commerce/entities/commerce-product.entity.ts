import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Commerce } from './commerce.entity';
import { CommerceProductImage } from './commerce-product-image.entity';

export enum CommerceProductType {
  PRODUCT = 'product',
  SERVICE = 'service',
}

@Entity({ name: 'commerce_product' })
export class CommerceProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // * ----------------------------------------------------------------------------------------------------------------
  // * RELATIONSHIPS
  // * ----------------------------------------------------------------------------------------------------------------
  @ManyToOne(() => Commerce, commerce => commerce.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commerce_id' })
  commerce: Commerce;

  @OneToMany(() => CommerceProductImage, image => image.product)
  images: CommerceProductImage[];

  // * ----------------------------------------------------------------------------------------------------------------
  // * MAIN FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('enum', { enum: CommerceProductType, default: CommerceProductType.PRODUCT })
  type: CommerceProductType;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('text', { nullable: true })
  sku: string | null;

  @Column('boolean', { name: 'is_available', default: true })
  isAvailable: boolean;

  @Column('integer', { nullable: true })
  stock: number | null;

  @Column('smallint', { default: 0 })
  order: number;

  // * ----------------------------------------------------------------------------------------------------------------
  // * CONTROL FIELDS
  // * ----------------------------------------------------------------------------------------------------------------
  @Column('boolean', { name: 'is_public', default: true })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
