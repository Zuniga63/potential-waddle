import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { TermsTypeEnum } from '../src/modules/terms/interfaces';

describe('Terms (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  // * ----------------------------------------------------------------------------------------------------------------
  // * GET /terms/active — public endpoint
  // * ----------------------------------------------------------------------------------------------------------------
  describe('GET /terms/active', () => {
    it('returns 200 + TermsDocumentDto shape for the seeded markdown user doc', async () => {
      const res = await request(app.getHttpServer())
        .get(`/terms/active?type=${TermsTypeEnum.User}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        type: TermsTypeEnum.User,
        format: 'markdown',
        updatedAt: expect.any(String),
      });
      // content exists for markdown seed
      expect(typeof res.body.content === 'string' || res.body.content === null).toBe(true);
    });

    it('returns 400 when the query param is not a valid TermsTypeEnum (ParseEnumPipe)', async () => {
      await request(app.getHttpServer())
        .get('/terms/active?type=invalidtype')
        .expect(400);
    });
  });

  // * ----------------------------------------------------------------------------------------------------------------
  // * Authorization (T-1-07)
  // * ----------------------------------------------------------------------------------------------------------------
  describe('Auth guarding', () => {
    it('GET /terms/me/status returns 401 when Authorization is missing', async () => {
      await request(app.getHttpServer()).get('/terms/me/status').expect(401);
    });

    it('POST /terms/:id/accept returns 401 when Authorization is missing', async () => {
      // Use any uuid — the guard should reject before the service is hit
      await request(app.getHttpServer())
        .post('/terms/00000000-0000-0000-0000-000000000000/accept')
        .send({ context: 'user_login_check' })
        .expect(401);
    });
  });

  // * ----------------------------------------------------------------------------------------------------------------
  // * Partial unique index invariant (T-1-02 @ DB level)
  // * ----------------------------------------------------------------------------------------------------------------
  describe('Partial unique index UQ_terms_documents_type_active', () => {
    it('rejects inserting a second active terms_documents row of the same type (code 23505)', async () => {
      await expect(
        dataSource.query(
          `INSERT INTO "terms_documents" ("type", "format", "content", "is_active") VALUES ('user', 'markdown', 'dup', true)`,
        ),
      ).rejects.toMatchObject({
        code: '23505',
      });
    });
  });
});
