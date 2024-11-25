import type { Facility } from 'src/modules/core/entities';

interface Params {
  /** Represents a string containing IDs, names, or slugs separated by commas */
  value?: string;
  /** List of workbook facilities */
  facilities: Facility[];
}

export function matchFacilitiesByValue({ value, facilities }: Params): Facility[] {
  if (!value) return [];

  const result: Facility[] = [];
  const identifiers = value.split(',').map(id => id.trim().toLocaleLowerCase());

  identifiers.forEach(identifier => {
    const facility = facilities.find(
      ({ id, slug, name }) => name.toLocaleLowerCase() === identifier || slug === identifier || id === identifier,
    );

    if (!facility) return;
    result.push(facility);
  });

  return result;
}
