import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CommerceProduct, CommerceProductImage, Commerce } from './entities';
import { CreateCommerceProductDto, UpdateCommerceProductDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryPresets, ResourceProvider } from 'src/config';
import { ImageResource } from '../core/entities';
import { CLOUDINARY_FOLDERS } from 'src/config/cloudinary-folders';
import { ReorderImagesDto } from '../common/dto/reoder-images.dto';

@Injectable()
export class CommerceProductsService {
  private readonly logger = new Logger(CommerceProductsService.name);

  constructor(
    @InjectRepository(CommerceProduct)
    private readonly productRepository: Repository<CommerceProduct>,
    @InjectRepository(Commerce)
    private readonly commerceRepository: Repository<Commerce>,
    @InjectRepository(CommerceProductImage)
    private readonly productImageRepository: Repository<CommerceProductImage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ------------------------------------------------------------------------------------------------
  // Create product
  // ------------------------------------------------------------------------------------------------
  async create(commerceId: string, createDto: CreateCommerceProductDto) {
    this.logger.log(`Creating product for commerceId: ${commerceId}`);
    this.logger.log(`CreateDto: ${JSON.stringify(createDto)}`);

    const commerce = await this.commerceRepository.findOne({ where: { id: commerceId } });
    this.logger.log(`Commerce found: ${commerce ? commerce.name : 'NOT FOUND'}`);

    if (!commerce) {
      throw new NotFoundException('Commerce not found');
    }

    try {
      // Use QueryBuilder for explicit insert
      const result = await this.productRepository
        .createQueryBuilder()
        .insert()
        .into(CommerceProduct)
        .values({
          ...createDto,
          commerce: { id: commerceId },
        })
        .returning('*')
        .execute();

      this.logger.log(`Insert result: ${JSON.stringify(result)}`);

      const insertedId = result.identifiers[0]?.id;
      this.logger.log(`Inserted product id: ${insertedId}`);

      if (!insertedId) {
        throw new BadRequestException('Failed to insert product');
      }

      // Fetch the product to return
      const product = await this.productRepository.findOne({
        where: { id: insertedId },
        relations: ['commerce'],
      });

      this.logger.log(`Fetched product after insert: ${JSON.stringify(product)}`);

      if (!product) {
        throw new BadRequestException('Product was inserted but could not be fetched');
      }

      return product;
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`, error.stack);
      throw new BadRequestException(`Error creating product: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Find all products for a commerce
  // ------------------------------------------------------------------------------------------------
  async findByCommerce(commerceId: string) {
    this.logger.log(`Finding products for commerceId: ${commerceId}`);

    const products = await this.productRepository.find({
      where: { commerce: { id: commerceId } },
      relations: ['images', 'images.imageResource'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    this.logger.log(`Found ${products.length} products for commerce ${commerceId}`);
    products.forEach(p => this.logger.log(`- Product: ${p.id} - ${p.name}`));

    return products;
  }

  // ------------------------------------------------------------------------------------------------
  // Find one product
  // ------------------------------------------------------------------------------------------------
  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['commerce', 'images', 'images.imageResource'],
      order: { images: { order: 'ASC' } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ------------------------------------------------------------------------------------------------
  // Update product
  // ------------------------------------------------------------------------------------------------
  async update(id: string, updateDto: UpdateCommerceProductDto) {
    await this.findOne(id); // Just validate existence

    try {
      await this.productRepository.update(id, updateDto);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(`Error updating product: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Delete product
  // ------------------------------------------------------------------------------------------------
  async remove(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'images.imageResource'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      // Delete images from Cloudinary first
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map(async image => {
          if (image.imageResource.publicId) {
            await this.cloudinaryService.destroyFile(image.imageResource.publicId);
          }
        });
        await Promise.all(deletePromises);
      }

      // Hard delete the product (this will cascade delete images due to foreign key)
      await this.productRepository.remove(product);

      return { message: `Product ${product.name} has been deleted` };
    } catch (error) {
      throw new BadRequestException(`Error deleting product: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Upload images
  // ------------------------------------------------------------------------------------------------
  async uploadImages(productId: string, files: Express.Multer.File[]) {
    this.logger.log(`Starting upload images for productId: ${productId}, files count: ${files?.length || 0}`);

    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: { images: { imageResource: true }, commerce: true },
      });

      if (!product) {
        this.logger.error(`Product not found for id: ${productId}`);
        throw new NotFoundException('Product not found');
      }

      this.logger.log(
        `Found product: ${product.name}, commerce: ${product.commerce?.name}, existing images: ${product.images?.length || 0}`,
      );

      // Process each file in the array
      const uploadPromises = files.map(async (file, index) => {
        this.logger.log(`Processing file ${index + 1}/${files.length}: ${file.originalname}`);

        // Upload the image to Cloudinary
        const cloudinaryRes = await this.cloudinaryService.uploadImage({
          file,
          fileName: `${product.commerce.name}-${product.name}`,
          preset: CloudinaryPresets.COMMERCE_IMAGE,
          folder: `${CLOUDINARY_FOLDERS.COMMERCE_GALLERY}/${product.commerce.slug}/products/${product.id}`,
        });

        if (!cloudinaryRes) {
          this.logger.error(`Failed to upload to Cloudinary for file: ${file.originalname}`);
          throw new BadRequestException('Error uploading image to Cloudinary');
        }

        this.logger.log(`Cloudinary upload successful for ${file.originalname}: ${cloudinaryRes.publicId}`);

        // Create and save the image resource
        const imageResource = this.productRepository.manager.create(ImageResource, {
          publicId: cloudinaryRes.publicId,
          url: cloudinaryRes.url,
          fileName: `${product.commerce.name}-${product.name}`,
          width: cloudinaryRes.width,
          height: cloudinaryRes.height,
          format: cloudinaryRes.format,
          resourceType: cloudinaryRes.type,
          provider: ResourceProvider.Cloudinary,
        });

        const savedImageResource = await this.productRepository.manager.save(ImageResource, imageResource);
        this.logger.log(`Image resource saved with ID: ${savedImageResource.id}`);

        // Create and save the product image association
        const productImage = this.productRepository.manager.create(CommerceProductImage, {
          imageResource: savedImageResource,
          order: product.images.length + index + 1,
          product: { id: product.id },
        });

        const savedProductImage = await this.productRepository.manager.save(CommerceProductImage, productImage);
        this.logger.log(`Product image association saved with ID: ${savedProductImage.id}`);
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      this.logger.log(`All ${files.length} images uploaded successfully`);
      return this.findOne(product.id);
    } catch (error) {
      this.logger.error(`Error uploading images for productId ${productId}:`, error.stack || error.message);
      throw new BadRequestException(`Error uploading images: ${error.message}`);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Get images
  // ------------------------------------------------------------------------------------------------
  async getImages(productId: string) {
    this.logger.log(`Getting images for productId: ${productId}`);

    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: {
          images: {
            imageResource: true,
          },
        },
      });

      if (!product) {
        this.logger.error(`Product not found for id: ${productId}`);
        throw new NotFoundException('Product not found');
      }

      this.logger.log(`Found product: ${product.name}, images count: ${product.images?.length || 0}`);

      const sortedImages = product.images.sort((a, b) => a.order - b.order);
      this.logger.log(`Returning ${sortedImages.length} sorted images`);

      return sortedImages;
    } catch (error) {
      this.logger.error(`Error getting images for productId ${productId}:`, error.stack || error.message);
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Delete image
  // ------------------------------------------------------------------------------------------------
  async deleteImage(productId: string, imageId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: {
        images: {
          imageResource: true,
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const image = product.images.find(img => img.id === imageId);
    if (!image) throw new NotFoundException('Image not found');

    try {
      // Delete from Cloudinary
      if (image.imageResource.publicId) {
        await this.cloudinaryService.destroyFile(image.imageResource.publicId);
      }

      // Delete from database
      await this.productRepository.manager.remove(image);

      // Reorder remaining images
      const remainingImages = product.images
        .filter(img => img.id !== imageId && img.id != undefined)
        .sort((a, b) => a.order - b.order);

      await Promise.all(
        remainingImages.map((img, index) =>
          this.productRepository.manager.update(CommerceProductImage, img.id, {
            order: index + 1,
          }),
        ),
      );

      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Error deleting image ' + error);
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Reorder images
  // ------------------------------------------------------------------------------------------------
  async reorderImages(productId: string, reorderDto: ReorderImagesDto) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: { images: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    try {
      const updatePromises = reorderDto.newOrder.map(({ id, order }) =>
        this.productImageRepository.update(id, { order }),
      );

      await Promise.all(updatePromises);

      return { message: 'Images reordered successfully' };
    } catch (error) {
      throw new BadRequestException('Error reordering images: ' + error.message);
    }
  }
}
