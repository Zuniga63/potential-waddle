/**
 * Normaliza un precio en Pesos Colombianos (COP) a un entero.
 *
 * El COP no tiene centavos; los separadores de miles son '.' y ','.
 * Por ejemplo: '$25.000' = veinticinco mil pesos = 25000 (nunca 25).
 *
 * @param raw - Valor de precio crudo del output del modelo (string, número, null o undefined)
 * @returns Precio entero en COP, o null si el valor no representa un precio válido
 */
export function parseCopPrice(raw: string | number | null | undefined): number | null {
  // 1. Null/undefined passthrough
  if (raw === null || raw === undefined) return null;

  const str = String(raw).trim();

  // 3. Indicadores de no-precio → null
  if (/precio\s+de\s+mercado|mkt|market\s+price|n\/a|s\/p|consultar/i.test(str)) return null;
  if (str === '' || str === '-') return null;

  // 4. Rango de precio → tomar la cota inferior
  const rangeMatch = str.match(/^([^–—\-~]+)[–—\-~].+$/);
  const candidate = rangeMatch ? rangeMatch[1] : str;

  // 5. Quitar símbolo de moneda y espacios
  const stripped = candidate.replace(/[\$COP\s]/gi, '');

  // 6. Quitar separadores de miles ('.' y ',')
  // En COP, '.' y ',' son SIEMPRE separadores de miles, nunca decimales
  const normalized = stripped.replace(/[.,]/g, '');

  // 7. Parsear e invalidar resultados negativos o NaN
  const num = parseInt(normalized, 10);
  if (isNaN(num) || num < 0) return null;

  return num;
}
