interface Params {
  basePoints?: number;
  difficultyLevel?: number;
  distance?: number;
  maxDistance?: number;
  popularity?: number;
  urbarCenterRange?: number;
}

export function calculatePoints({
  basePoints = 100,
  difficultyLevel = 1,
  distance = 0,
  maxDistance = 0,
  popularity = 0,
  urbarCenterRange = 0,
}: Params): number {
  const distanceFactor = calculateDistanceFactor(distance, maxDistance, urbarCenterRange);
  const difficultyFactor = calculateDifficultyFactor(difficultyLevel);
  const popularityFactor = calculatePopularityFactor(popularity);

  return Math.round(basePoints * (1 + distanceFactor + difficultyFactor + popularityFactor));
}

function calculateDistanceFactor(distance: number, maxDistance: number, townRange = 0): number {
  const distanceWeight = 0.5; // 50%

  if (maxDistance === 0 || distance === 0) return 0;

  // If the town range is 0, the distance factor is calculated based on the max distance
  if (townRange === 0) return (distance / maxDistance) * distanceWeight;

  // If the distance is less than the town range, the distance factor is calculated based on the town range
  // and the distance weight
  if (distance <= townRange) return (distance / townRange) * distanceWeight - distanceWeight;

  // If the distance is greater than the town range, the distance factor is calculated based on the max distance
  // and the town range to max distance ratio and the distance weight
  return ((distance - townRange) / (maxDistance - townRange)) * distanceWeight;
}

function calculateDifficultyFactor(difficultyLevel: number): number {
  const difficultyWeight = 0.25; // 25%

  if (difficultyLevel <= 1) return 0;

  return (difficultyLevel - 1 / 4) * difficultyWeight;
}

function calculatePopularityFactor(popularity: number): number {
  const popularityWeight = 0.5; // 50%

  return ((5 - popularity) / 5) * popularityWeight;
}
