import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from '../entities';
import { User } from 'src/modules/users/entities';

/**
 * Authorization guard for restaurant menu mutations (upload / delete).
 *
 * `@Auth()` alone only verifies the request is authenticated — it does NOT check
 * whether the user may act on the `:restaurantId` in the route. That left an IDOR
 * gap: any logged-in user could POST a menu (incurring an AI cost) or delete a
 * menu on ANY restaurant by calling the endpoint directly with an arbitrary id.
 *
 * This guard closes it server-side. Access is granted only to:
 *   - super-admins (`user.isSuperUser`),
 *   - the restaurant owner (`restaurant.user`),
 *   - an admin of the restaurant's town (`user.towns` includes `restaurant.town`).
 * Everyone else gets 403 before any GCS upload or Claude call happens.
 *
 * ⚠️ MUST run AFTER JwtAuthGuard so `request.user` is populated. Place
 * `@UseGuards(RestaurantMenuAccessGuard)` ABOVE `@Auth()` on the handler — guard
 * metadata is appended in decorator-evaluation order, so the guards from `@Auth()`
 * (Jwt → Permissions) end up before this one and execute first.
 */
@Injectable()
export class RestaurantMenuAccessGuard implements CanActivate {
  constructor(@InjectRepository(Restaurant) private readonly restaurantRepository: Repository<Restaurant>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;
    if (!user) throw new ForbiddenException('Usuario no autenticado');

    const restaurantId: string | undefined = request.params?.restaurantId;
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: { user: true, town: true },
    });
    if (!restaurant) throw new NotFoundException(`Restaurant with id ${restaurantId} not found`);

    // Super-admin: full access.
    if (user.isSuperUser) return true;

    // Owner: the user the restaurant belongs to (profile flow). Mirrors
    // restaurants.service.ts `isOwner` check.
    if (restaurant.user?.id && restaurant.user.id === user.id) return true;

    // Town admin: the user manages the municipality this restaurant belongs to.
    const townId = restaurant.town?.id;
    if (townId && (user.towns ?? []).some(town => town.id === townId)) return true;

    throw new ForbiddenException('No tienes permiso para gestionar la carta de este restaurante');
  }
}
