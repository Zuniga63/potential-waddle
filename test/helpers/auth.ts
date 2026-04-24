import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Shape returned by {@link getAuthToken}. Encapsulates the pieces a typical e2e
 * suite needs after bootstrapping an authenticated user.
 */
export interface AuthFixture {
  accessToken: string;
  userId: string;
  email: string;
}

/**
 * Creates a fresh local-credential user and logs them in, returning the JWT
 * plus the primary identity fields needed by downstream e2e assertions.
 *
 * The username/email are randomized per call so parallel e2e blocks never
 * collide on the unique constraints of the users table.
 *
 * Must be called after `app.init()` so the HTTP server is live.
 */
export async function getAuthToken(app: INestApplication): Promise<AuthFixture> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const email = `e2e-${suffix}@binntu.test`;
  const username = `e2e-user-${suffix}`;
  const password = 'Password123*';

  // 1. Signup — matches `POST /auth/local/signup` contract in AuthController.
  await request(app.getHttpServer())
    .post('/auth/local/signup')
    .send({
      username,
      email,
      password,
      passwordConfirmation: password,
    })
    .expect(201);

  // 2. Signin — matches `POST /auth/local/signin` contract (LocalAuthGuard).
  const loginRes = await request(app.getHttpServer())
    .post('/auth/local/signin')
    .send({ email, password })
    .expect(201);

  const accessToken: string | undefined = loginRes.body?.accessToken;
  const userId: string | undefined = loginRes.body?.user?.id;

  if (!accessToken || !userId) {
    throw new Error(
      `getAuthToken: login response missing accessToken or user.id — body=${JSON.stringify(loginRes.body)}`,
    );
  }

  return { accessToken, userId, email };
}
