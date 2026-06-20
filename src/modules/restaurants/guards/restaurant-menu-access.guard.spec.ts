/**
 * Unit spec for RestaurantMenuAccessGuard (SEC-02).
 *
 * Covers all authorization branches to prevent silent IDOR regressions:
 *   - super-admin bypass
 *   - restaurant owner access
 *   - town-admin access
 *   - 403 for unauthorized outsiders
 *   - 403 when no user on request (unauthenticated)
 *   - 404 when restaurant does not exist
 *   - Verifies repo is called with correct relations { user: true, town: true }
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ExecutionContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RestaurantMenuAccessGuard } from './restaurant-menu-access.guard';
import { Restaurant } from '../entities';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(
  user: Record<string, unknown> | undefined,
  params: Record<string, string> = { restaurantId: 'r-1' },
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params }),
    }),
  } as unknown as ExecutionContext;
}

function restaurantOwnedBy(
  userId: string | null,
  townId: string | null,
): Partial<Restaurant> {
  return {
    id: 'r-1',
    user: userId ? ({ id: userId } as never) : undefined,
    town: townId ? ({ id: townId } as never) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('RestaurantMenuAccessGuard', () => {
  let guard: RestaurantMenuAccessGuard;
  const findOne = jest.fn();

  beforeEach(async () => {
    findOne.mockReset();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantMenuAccessGuard,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: { findOne },
        },
      ],
    }).compile();

    guard = moduleRef.get(RestaurantMenuAccessGuard);
  });

  // -------------------------------------------------------------------------
  // Rama super-admin
  // -------------------------------------------------------------------------
  it('super-admin -> true (acceso total sin importar dueño o municipio)', async () => {
    findOne.mockResolvedValue(restaurantOwnedBy('otro-user', 't-otra'));

    const user = { id: 'u-super', isSuperUser: true, towns: [] };
    const ctx = makeContext(user);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  // -------------------------------------------------------------------------
  // Rama owner
  // -------------------------------------------------------------------------
  it('owner -> true (restaurant.user.id === user.id)', async () => {
    findOne.mockResolvedValue(restaurantOwnedBy('u-owner', 't-1'));

    const user = { id: 'u-owner', isSuperUser: false, towns: [] };
    const ctx = makeContext(user);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  // -------------------------------------------------------------------------
  // Rama town-admin
  // -------------------------------------------------------------------------
  it('town-admin -> true (municipio del restaurante en user.towns)', async () => {
    findOne.mockResolvedValue(restaurantOwnedBy('otro-user', 't-1'));

    const user = { id: 'u-admin', isSuperUser: false, towns: [{ id: 't-1' }] };
    const ctx = makeContext(user);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  // -------------------------------------------------------------------------
  // Rama denegada (outsider)
  // -------------------------------------------------------------------------
  it('outsider -> 403 con mensaje descriptivo', async () => {
    findOne.mockResolvedValue(restaurantOwnedBy('otro-user', 't-1'));

    const user = { id: 'u-x', isSuperUser: false, towns: [{ id: 't-9' }] };
    const ctx = makeContext(user);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'No tienes permiso para gestionar la carta de este restaurante',
    );
  });

  // -------------------------------------------------------------------------
  // Sin user en request (unauthenticated)
  // -------------------------------------------------------------------------
  it('sin user en request -> 403 y NO se consulta el repositorio', async () => {
    const ctx = makeContext(undefined);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(ctx)).rejects.toThrow('Usuario no autenticado');

    expect(findOne).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Restaurant inexistente
  // -------------------------------------------------------------------------
  it('restaurant inexistente -> NotFoundException (404)', async () => {
    findOne.mockResolvedValue(null);

    const user = { id: 'u-valid', isSuperUser: false, towns: [] };
    const ctx = makeContext(user);

    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
  });

  // -------------------------------------------------------------------------
  // Verificacion de relaciones cargadas
  // -------------------------------------------------------------------------
  it('carga el restaurant con relations { user: true, town: true }', async () => {
    findOne.mockResolvedValue(restaurantOwnedBy('u-owner', 't-1'));

    const user = { id: 'u-owner', isSuperUser: false, towns: [] };
    const ctx = makeContext(user, { restaurantId: 'r-1' });

    await guard.canActivate(ctx);

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'r-1' },
      relations: { user: true, town: true },
    });
  });
});
