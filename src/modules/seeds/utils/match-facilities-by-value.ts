import type { SheetFacility } from '../interfaces';

interface Params {
  /** Represents a string containing IDs, names, or slugs separated by commas */
  value?: string;
  /** List of workbook facilities */
  facilities: SheetFacility[];
}

export function matchFacilitiesByValue({ value, facilities }: Params): SheetFacility[] {
  if (!value) return [];

  const result: SheetFacility[] = [];
  const identifiers = value.split(',').map(id => id.trim().toLocaleLowerCase());

  identifiers.forEach(identifier => {
    const facility = facilities.find(
      ({ id, slug, name }) => name === identifier || slug === identifier || id === identifier,
    );

    if (!facility) return;
    result.push(facility);
  });

  return result;
}
