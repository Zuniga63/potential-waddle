import type { Repository } from 'typeorm';
import type { Review } from '../../entities';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

interface Params {
  id: string;
  repository: Repository<Review>;
}

export async function fetchReviewApprovalData({ id, repository }: Params) {
  const review = await repository.findOne({
    where: { id },
    relations: { place: { town: true }, user: true },
    select: {
      id: true,
      status: true,
      place: { id: true, name: true, points: true, town: { id: true, name: true }, urbarCenterDistance: true },
      user: { id: true },
    },
  });

  if (!review) throw new NotFoundException('Review not found');
  if (!review.place) throw new UnprocessableEntityException('Only place reviews can be approved');
  if (!review.user) throw new BadRequestException('This review does not have a user');

  const user = review.user;
  const place = review.place;
  const town = place.town;

  return { review, user, place, town };
}
