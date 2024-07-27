export function parseArrayValue<T>(value: T | T[] | undefined): T[] | undefined {
  if (!value) return undefined;

  if (Array.isArray(value)) return value.length > 0 ? value : undefined;

  if (typeof value === 'string') {
    const result = (value as unknown as string)
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0) as T[];

    return result.length > 0 ? result : undefined;
  }

  return undefined;
}
