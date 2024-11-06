import { Place } from 'src/modules/places/entities';
import { Town } from 'src/modules/towns/entities';
import { User, UserPoint } from 'src/modules/users/entities';
import { Review } from '../../entities';
import { Repository } from 'typeorm';

interface Params {
  user: User;
  place: Place;
  town: Town;
  review: Review;
  userRepository: Repository<User>;
  userPointRepository: Repository<UserPoint>;
}

export async function assignPlacePoints({ user, place, town, review, userRepository, userPointRepository }: Params) {
  const points = place.points;
  const distanceTravelled = place.urbarCenterDistance;

  const pointRecordExist = await userPointRepository.exists({
    where: {
      user: { id: user.id },
      town: { id: town.id },
      place: { id: place.id },
    },
  });

  if (pointRecordExist) return;

  await userRepository.increment({ id: user.id }, 'totalPoints', points);
  await userRepository.increment({ id: user.id }, 'rankingPoints', points);
  await userRepository.increment({ id: user.id }, 'remainingPoints', points);
  await userRepository.increment({ id: user.id }, 'distanceTravelled', distanceTravelled);

  const pointRecord = userPointRepository.create({
    user: { id: user.id },
    town: { id: town.id },
    review: { id: review.id },
    place: { id: place.id },
    pointsEarned: points,
    pointsReedemed: 0,
    distanceTravelled,
  });

  await userPointRepository.save(pointRecord);
}
