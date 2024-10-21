import { POINT_BONUS } from 'src/config';
import { calculateCircularRadius } from 'src/utils';

/**
 * Interface representing the parameters for calculating points.
 */
interface Params {
  /** The base points used as a starting value for calculation. Default is 100. */
  basePoints?: number;
  /** The difficulty level of the activity, influencing the difficulty factor. Default is 1. */
  difficultyLevel?: number;
  /** The distance to be traveled, used to calculate the distance factor. Default is 0. */
  distance?: number;
  /** The maximum possible distance, used as a reference for distance calculations. Default is 0. */
  maxDistance?: number;
  /** The popularity of the location or activity (1-5), affecting the popularity factor. Default is 0. */
  popularity?: number;
  /** The town area in sqkm, used to determine distance penalties or bonuses. Default is 0. */
  townArea?: number;
}

/**
 * Calculates the total points based on various factors such as distance, difficulty level, and popularity.
 * @returns {number} - The total calculated points.
 */
export function calculatePoints({
  basePoints = 100,
  difficultyLevel = 1,
  distance = 0,
  maxDistance = 0,
  popularity = 0,
  townArea = 0,
}: Params): number {
  const distanceBonus = calculateDistanceBonus(distance, maxDistance, townArea);
  const difficultyBonus = calculateDifficultyBonus(difficultyLevel);
  const popularityBonus = calculatePopularityBonus(popularity);

  // Adjust the final calculation to ensure the factors are balanced
  const totalFactor = 1 + (distanceBonus + difficultyBonus + popularityBonus) / 3;
  return Math.round(basePoints * totalFactor);
}

/**
 * Calculates the distance factor based on the distance, maximum distance, and town radius.
 *
 * @param {number} distance - The distance to be traveled.
 * @param {number} maxDistance - The maximum possible distance.
 * @param {number} [townArea=0] - The town area in sqm.
 * @returns {number} - The calculated distance factor.
 */
function calculateDistanceBonus(distance: number, maxDistance: number, townArea: number = 0): number {
  const distanceBonus = POINT_BONUS.distance;
  const townRadio = calculateCircularRadius({ area: townArea, unit: 'sqkm' });

  if (maxDistance === 0 || distance === 0) return 0;

  if (townRadio === 0) {
    // Si no hay radio del pueblo, calcula el factor en función de la distancia máxima
    return (distance / maxDistance) * distanceBonus;
  }

  if (distance <= townRadio) {
    // Penaliza hasta un 50% si la distancia es menor que el radio del pueblo
    return -((townRadio - distance) / townRadio) * distanceBonus;
  }

  if (distance === maxDistance) {
    // Da una bonificación del 50% si la distancia es la distancia máxima
    return distanceBonus;
  }

  // Si la distancia es mayor al radio del pueblo, calcula el factor considerando la distancia máxima
  return ((distance - townRadio) / (maxDistance - townRadio)) * distanceBonus;
}

/**
 * Calculates the difficulty factor based on the difficulty level.
 *
 * @param {number} difficultyLevel - The difficulty level of the activity.
 * @returns {number} - The calculated difficulty factor. This factor grows non-linearly, with higher difficulty levels resulting in a greater percentage increase.
 *                     The factor is capped at 1 to ensure it does not exceed the maximum allowed value.
 */
function calculateDifficultyBonus(difficultyLevel: number): number {
  const difficultyBonus = POINT_BONUS.difficulty;

  if (difficultyLevel <= 0) return 0;
  if (difficultyLevel >= 5) return difficultyBonus;

  const segments = [
    { xStart: 0, xEnd: 1, yStart: 0, yEnd: 0.1 },
    { xStart: 1, xEnd: 2, yStart: 0.1, yEnd: 0.2 },
    { xStart: 2, xEnd: 3, yStart: 0.2, yEnd: 0.35 },
    { xStart: 3, xEnd: 4, yStart: 0.35, yEnd: 0.5 },
    { xStart: 4, xEnd: 5, yStart: 0.5, yEnd: 1 },
  ];

  const epsilon = 1e-10; // Pequeño valor para evitar problemas con log(0)

  // Encontrar el segmento correspondiente al nivel de dificultad
  const segment = segments.find(s => difficultyLevel <= s.xEnd)!;

  const { xStart, xEnd, yStart, yEnd } = segment;

  // Calcular la constante k para el crecimiento exponencial
  const k = Math.log((yEnd + epsilon) / (yStart + epsilon)) / (xEnd - xStart);

  const difficultyFactor = (yStart + epsilon) * Math.exp(k * (difficultyLevel - xStart)) - epsilon;

  return difficultyFactor * difficultyBonus;
}

/**
 * Calculates the popularity factor based on the popularity rating.
 *
 * @param {number} popularity - The popularity of the location or activity (1-5).
 * @returns {number} - The calculated popularity factor.
 */
function calculatePopularityBonus(popularity: number): number {
  const popularityBonus = POINT_BONUS.popularity; // 50%

  if (popularity <= 0) return popularityBonus;
  if (popularity >= 5) return 0;

  const segments = [
    { xStart: 0, xEnd: 1, yStart: 0, yEnd: 0.1 },
    { xStart: 1, xEnd: 2, yStart: 0.1, yEnd: 0.2 },
    { xStart: 2, xEnd: 3, yStart: 0.2, yEnd: 0.5 },
    { xStart: 3, xEnd: 4, yStart: 0.5, yEnd: 0.9 },
    { xStart: 4, xEnd: 5, yStart: 0.9, yEnd: 1 },
  ];

  const epsilon = 1e-10; // Pequeño valor para evitar problemas con log(0)

  // Encontrar el segmento correspondiente al nivel de dificultad
  const segment = segments.find(s => popularity <= s.xEnd)!;
  const { xStart, xEnd, yStart, yEnd } = segment;

  // Calcular la constante k para el crecimiento exponencial
  const k = Math.log((yEnd + epsilon) / (yStart + epsilon)) / (xEnd - xStart);

  const difficultyFactor = (yStart + epsilon) * Math.exp(k * (popularity - xStart)) - epsilon;

  return (1 - difficultyFactor) * popularityBonus;
}
