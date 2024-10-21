import type { AreaUnit, LengthUnit } from 'src/types';
import { areaConversion, lengthConversion } from './conversions';

interface CalculateAreaParams {
  /** The radius of the circle. */
  radius: number;
  /** The unit of length to use for the radius. default m */
  unit?: LengthUnit;
  /** The unit of result default sqm */
  resultUnit?: AreaUnit;
}

export const calculateCircularArea = ({ radius, unit = 'm', resultUnit = 'sqm' }: CalculateAreaParams): number => {
  const radiusInMeters = lengthConversion(radius, unit, 'm');
  const area = Math.PI * Math.pow(radiusInMeters, 2);
  return areaConversion(area, 'sqm', resultUnit);
};

interface CalculateRadioParams {
  /** The area of the circle. */
  area: number;
  /** The unit of area to use for the circle. default sqm */
  unit?: AreaUnit;
  /** The unit of result default m */
  resultUnit?: LengthUnit;
}

/**
 * Calculate the radius of a circle given its area.
 * @param param0
 * @returns The radius of the circle in the specified unit. by default in meters.
 */
export const calculateCircularRadius = ({ area, unit = 'sqm', resultUnit = 'm' }: CalculateRadioParams): number => {
  const areaInSquareMeters = areaConversion(area, unit, 'sqm');
  const radius = Math.sqrt(areaInSquareMeters / Math.PI);
  return lengthConversion(radius, 'm', resultUnit);
};
