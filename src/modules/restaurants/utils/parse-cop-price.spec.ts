import { parseCopPrice } from './parse-cop-price';

describe('parseCopPrice', () => {
  // -----------------------------------------------------------------------
  // Formato de miles con punto ('.')
  // -----------------------------------------------------------------------
  it("'$25.000' → 25000 (separador de miles '.' en COP)", () => {
    expect(parseCopPrice('$25.000')).toBe(25000);
  });

  it("'$1.500.000' → 1500000 (múltiples separadores de miles)", () => {
    expect(parseCopPrice('$1.500.000')).toBe(1500000);
  });

  // -----------------------------------------------------------------------
  // Formato de miles con coma (',')
  // -----------------------------------------------------------------------
  it("'25,000' → 25000 (separador de miles ',')", () => {
    expect(parseCopPrice('25,000')).toBe(25000);
  });

  it("'1,500,000' → 1500000 (múltiples comas como separadores)", () => {
    expect(parseCopPrice('1,500,000')).toBe(1500000);
  });

  // -----------------------------------------------------------------------
  // Passthrough de número entero
  // -----------------------------------------------------------------------
  it('25000 (number) → 25000 (entero directo, sin conversión)', () => {
    expect(parseCopPrice(25000)).toBe(25000);
  });

  // -----------------------------------------------------------------------
  // Rangos de precio → cota inferior
  // -----------------------------------------------------------------------
  it("'$10.000–$15.000' → 10000 (rango con guión especial '–', tomar cota inferior)", () => {
    expect(parseCopPrice('$10.000–$15.000')).toBe(10000);
  });

  it("'$10.000-$15.000' → 10000 (rango con guión ASCII '-', tomar cota inferior)", () => {
    expect(parseCopPrice('$10.000-$15.000')).toBe(10000);
  });

  it("'$10.000~$15.000' → 10000 (rango con tilde '~', tomar cota inferior)", () => {
    expect(parseCopPrice('$10.000~$15.000')).toBe(10000);
  });

  // -----------------------------------------------------------------------
  // Indicadores de no-precio → null
  // -----------------------------------------------------------------------
  it("'precio de mercado' → null", () => {
    expect(parseCopPrice('precio de mercado')).toBeNull();
  });

  it("'mkt' → null", () => {
    expect(parseCopPrice('mkt')).toBeNull();
  });

  it("'market price' → null", () => {
    expect(parseCopPrice('market price')).toBeNull();
  });

  it("'n/a' → null", () => {
    expect(parseCopPrice('n/a')).toBeNull();
  });

  it("'S/P' → null (español: sin precio)", () => {
    expect(parseCopPrice('S/P')).toBeNull();
  });

  it("'consultar' → null", () => {
    expect(parseCopPrice('consultar')).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Cadenas vacías y guión solo → null
  // -----------------------------------------------------------------------
  it("'' (cadena vacía) → null", () => {
    expect(parseCopPrice('')).toBeNull();
  });

  it("'-' (solo guión) → null", () => {
    expect(parseCopPrice('-')).toBeNull();
  });

  // -----------------------------------------------------------------------
  // null y undefined → null
  // -----------------------------------------------------------------------
  it('null → null', () => {
    expect(parseCopPrice(null)).toBeNull();
  });

  it('undefined → null', () => {
    expect(parseCopPrice(undefined)).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Prefijo COP
  // -----------------------------------------------------------------------
  it("'COP 25.000' → 25000 (prefijo COP eliminado)", () => {
    expect(parseCopPrice('COP 25.000')).toBe(25000);
  });

  // -----------------------------------------------------------------------
  // Resultado negativo o NaN → null
  // -----------------------------------------------------------------------
  it("texto no numérico 'abc' → null", () => {
    expect(parseCopPrice('abc')).toBeNull();
  });
});
