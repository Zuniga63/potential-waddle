import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CategoryDocumentExclusion } from '../entities';
import { DocumentType } from '../entities';
import { Category } from '../../core/entities/category.entity';

@Injectable()
export class CategoryDocumentExclusionService {
  constructor(
    @InjectRepository(CategoryDocumentExclusion)
    private readonly exclusionRepository: Repository<CategoryDocumentExclusion>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getExclusionsByCategoryId(categoryId: string): Promise<string[]> {
    const exclusions = await this.exclusionRepository.find({
      where: { category: { id: categoryId } },
      relations: ['documentType'],
    });

    return exclusions.map((e) => e.documentType.id);
  }

  async getExcludedDocumentTypeIdsByCategoryIds(categoryIds: string[]): Promise<string[]> {
    if (!categoryIds.length) return [];

    const exclusions = await this.exclusionRepository.find({
      where: { category: { id: In(categoryIds) } },
      relations: ['documentType'],
    });

    return [...new Set(exclusions.map((e) => e.documentType.id))];
  }

  async getCategoryWithExclusions(categoryId: string): Promise<{
    category: Category;
    excludedDocumentTypeIds: string[];
    availableDocumentTypes: DocumentType[];
  }> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['models'],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const excludedDocumentTypeIds = await this.getExclusionsByCategoryId(categoryId);

    // Get all active document types
    const availableDocumentTypes = await this.documentTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return {
      category,
      excludedDocumentTypeIds,
      availableDocumentTypes,
    };
  }

  async updateExclusions(categoryId: string, documentTypeIds: string[]): Promise<void> {
    // Delete all existing exclusions for this category
    await this.exclusionRepository.delete({ category: { id: categoryId } });

    // Create new exclusions
    if (documentTypeIds.length > 0) {
      const exclusions = documentTypeIds.map((documentTypeId) => {
        const exclusion = new CategoryDocumentExclusion();
        exclusion.category = { id: categoryId } as Category;
        exclusion.documentType = { id: documentTypeId } as DocumentType;
        return exclusion;
      });

      await this.exclusionRepository.save(exclusions);
    }
  }

  async addExclusion(categoryId: string, documentTypeId: string): Promise<CategoryDocumentExclusion> {
    const exclusion = this.exclusionRepository.create({
      category: { id: categoryId },
      documentType: { id: documentTypeId },
    });

    return this.exclusionRepository.save(exclusion);
  }

  async removeExclusion(categoryId: string, documentTypeId: string): Promise<void> {
    await this.exclusionRepository.delete({
      category: { id: categoryId },
      documentType: { id: documentTypeId },
    });
  }
}
