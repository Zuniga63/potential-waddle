/**
 * An object with the following properties:
 * @member {any} value - Filter value to parse e.g., 1,2,3,4,5 or [1,2,3,4,5] or '1,2,3,4,5' or '1, 2, 3, 4, 5'
 * @member {number} [min] - minimum value to validate
 * @member {number} [max] - maximum value to validate
 */
interface Params {
  /** Filter value to parse e.g., 1,2,3,4,5 or [1,2,3,4,5] or '1,2,3,4,5' or '1, 2, 3, 4, 5' */
  value: any;
  /** Minimum value to validate */
  min?: number;
  /** Maximum value to validate */
  max?: number;
}

/**
 * Parse numeric filter value to an array of numbers or undefined if the value is invalid.
 * @param {Params} params - object with value, min, and max properties
 * @returns {number[] | undefined} - array of numbers or undefined
 * @example
 * parseNumericFilterToArray({ value: 1 }); // [1]
 * parseNumericFilterToArray({ value: [1, 2, 3] }); // [1, 2, 3]
 * parseNumericFilterToArray({ value: '1,2,3' }); // [1, 2, 3]
 * parseNumericFilterToArray({ value: '1, 2, 3, 4, 5' }); // [1, 2, 3, 4, 5]
 * parseNumericFilterToArray({ value: '1, 2, 3, 4, 5, 6', min: 1, max: 5 }); // [1, 2, 3, 4, 5]
 * parseNumericFilterToArray({ value: '1, 2, 3, 4, 5, 6', min: 2, max: 4 }); // [2, 3, 4]
 * parseNumericFilterToArray({ value: '1, 2, 3, 4, 5, 6', min: 7, max: 10 }); // undefined
 */
export function parseNumericFilterToArray({ value, min, max }: Params): number[] | undefined {
  if (!value) return undefined;

  const validateValue = (value: number) => {
    if (Number.isNaN(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  };

  if (Array.isArray(value)) {
    const result = value.map(item => Number(item)).filter(validateValue);
    return result.length > 0 ? result : undefined;
  }

  if (typeof value === 'string') {
    const result = (value as unknown as string)
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => Number(item))
      .filter(validateValue);

    return result.length > 0 ? result : undefined;
  }

  return undefined;
}
