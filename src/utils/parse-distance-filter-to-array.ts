import { isEmpty } from 'class-validator';
import type { DistanceRange } from 'src/modules/common/types';

/**
 * Parse a distance filter string to an array of distance ranges.
 * @param value - Filter value to parse e.g., '1-2,3-4,5-6' or ['1-2', '3-4', '5-6']
 * @returns {DistanceRange[]} - array of distance ranges
 * @example
 * parseDistanceFilterToArray('1-2,3-4,5-6'); // [[1, 2], [3, 4], [5, 6]]
 * parseDistanceFilterToArray(['1-2', '3-4', '5-6']); // [[1, 2], [3, 4], [5, 6]]
 * parseDistanceFilterToArray('1-2, 3-4, 5-6'); // [[1, 2], [3, 4], [5, 6]]
 * parseDistanceFilterToArray('1-2, 3-4, 5-6, -8'); // [[1, 2], [3, 4], [5, 6], [undefined, 8]]
 */
export function parseDistanceFilterToArray(value: unknown): DistanceRange[] {
  if (!value) return [];

  const parseValue = (value: string): number | undefined => {
    const distance = isEmpty(value) ? undefined : Number(value);
    return isNaN(distance) ? undefined : distance;
  };

  const parseRange = (item: string): DistanceRange | null => {
    const [min, max] = item.split('-').map(parseValue);
    return [min, max] as DistanceRange;
  };

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item !== 'string') return null;
        return parseRange(item);
      })
      .filter((item): item is DistanceRange => item !== null);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(parseRange)
      .filter((item): item is DistanceRange => item !== null);
  }

  return [];
}
