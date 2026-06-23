import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { HealthReport } from '@signalscout/shared';
import { AppModule } from '../src/app.module';
import { SupabaseHealthCheck } from '../src/supabase/supabase.health';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SupabaseHealthCheck)
      .useValue({ name: 'supabase', check: () => Promise.resolve(true) })
      .compile();
    app = moduleRef.createNestApplication({ bufferLogs: false });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health returns a liveness report', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as HealthReport;
    expect(body).toMatchObject({ status: 'ok', service: 'signalscout-api' });
    expect(typeof body.uptimeSeconds).toBe('number');
  });

  it('GET /ready returns a readiness report', async () => {
    const response = await request(app.getHttpServer())
      .get('/ready')
      .expect(200);
    const body = response.body as HealthReport;
    expect(body.status).toBe('ok');
  });
});
