import type { AreaUnit, LengthUnit } from 'src/types';

export const areaConversion = (value: number, from: AreaUnit, to: AreaUnit): number => {
  const sqm = {
    sqm: 1,
    sqft: 10.7639,
    sqyd: 1.19599,
    sqmi: 3.861e-7,
    sqkm: 1e-6,
    acre: 0.000247105,
    hectare: 1e-4,
  };

  return (value * sqm[from]) / sqm[to];
};

export const lengthConversion = (value: number, from: LengthUnit, to: LengthUnit): number => {
  const m = {
    m: 1,
    cm: 100,
    mm: 1000,
    km: 0.001,
    in: 39.3701,
    ft: 3.28084,
    yd: 1.09361,
    mi: 0.000621371,
  };

  return (value * m[from]) / m[to];
};
