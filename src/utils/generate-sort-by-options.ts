export function generateSortByOptions(sortByEnum: Record<string, string>) {
  // Generamos el arreglo extendido con y sin el guion
  const sortByValues = Object.values(sortByEnum).reduce((acc, value) => {
    acc.push(value, `-${value}`);
    return acc;
  }, [] as string[]);

  // Generamos la descripción
  const description = `Valid values are: ${sortByValues.join(', ')}`;

  // Retornamos tanto la descripción como el array de valores
  return {
    description,
    sortByEnum: sortByValues,
  };
}
