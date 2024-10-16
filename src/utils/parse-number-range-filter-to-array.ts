import { isEmpty } from 'class-validator';
import type { NumberRange } from 'src/modules/common/types';

/**
 * Parse a number filter string to an array of number ranges.
 * @param value - Filter value to parse e.g., '1-2,3-4,5-6' or ['1-2', '3-4', '5-6']
 * @returns {NumberRange[]} - array of number ranges
 * @example
 * parseDistanceFilterToArray('1-2,3-4,5-6'); // [[1, 2], [3, 4], [5, 6]]
 * parseDistanceFilterToArray(['1-2', '3-4', '5-6']); // [[1, 2], [3, 4], [5, 6]]
 * parseDistanceFilterToArray('1-2, 3-4, 5-6'); // [[1, 2], [3, 4], [5, 6]]
 * parseDistanceFilterToArray('1-2, 3-4, 5-6, -8'); // [[1, 2], [3, 4], [5, 6], [undefined, 8]]
 */
export function parseNumberRangeFilterToArray(value: unknown): NumberRange[] {
  if (!value) return [];

  const formatValue = (value: string): string => value.trim().replaceAll('_', '').replaceAll(' ', '');

  const parseValue = (value: string): number | undefined => {
    const distance = isEmpty(value) ? undefined : Number(formatValue(value));
    if (distance === undefined) return undefined;
    return isNaN(distance) ? undefined : distance;
  };

  const parseRange = (item: string): NumberRange | null => {
    const [min, max] = item.split('-').map(parseValue);
    return [min, max] as NumberRange;
  };

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item !== 'string') return null;
        return parseRange(item);
      })
      .filter((item): item is NumberRange => item !== null);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(parseRange)
      .filter((item): item is NumberRange => item !== null);
  }

  return [];
}
