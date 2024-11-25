import type { Category } from 'src/modules/core/entities';

interface Params {
  /** Represents a string containing IDs, names, or slugs separated by commas */
  value?: string;
  /** List of workbook categories */
  categories: Category[];
}

/**
 * Matches categories by their ID, name, or slug.
 * @param value Represents a string containing IDs, names, or slugs separated by commas
 * @param categories List of workbook categories
 * @returns List of matched categories
 */
export function matchCategoriesByValue({ value, categories }: Params): Category[] {
  if (!value) return [];

  const result: Category[] = [];
  const identifiers = value.split(',').map(id => id.trim().toLocaleLowerCase());

  identifiers.forEach(identifier => {
    const category = categories.find(
      ({ id, slug, name }) => name.toLocaleLowerCase() === identifier || slug === identifier || id === identifier,
    );

    if (!category) return;
    result.push(category);
  });

  return result;
}
