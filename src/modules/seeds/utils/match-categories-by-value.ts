import type { SheetCategory } from '../interfaces';

interface Params {
  /** Represents a string containing IDs, names, or slugs separated by commas */
  value?: string;
  /** List of workbook categories */
  categories: SheetCategory[];
}

/**
 * Matches categories by their ID, name, or slug.
 * @param value Represents a string containing IDs, names, or slugs separated by commas
 * @param categories List of workbook categories
 * @returns List of matched categories
 */
export function matchCategoriesByValue({ value, categories }: Params): SheetCategory[] {
  if (!value) return [];

  const result: SheetCategory[] = [];
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
