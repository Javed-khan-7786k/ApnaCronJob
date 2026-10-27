import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { signToken } from '../src/utils/crypto.js';

describe('Enhanced SaaS Endpoints Security & Structure', () => {
  const authToken = signToken({ userId: '6ae011ff2fa12b3d1af972de', role: 'admin' });

  it('GET /api/api-keys requires authentication', async () => {
    const res = await request(app).get('/api/api-keys');
    expect(res.status).toBe(401);
  });

  it('GET /api/notifications requires authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/integrations requires authentication', async () => {
    const res = await request(app).get('/api/integrations');
    expect(res.status).toBe(401);
  });

  it('GET /api/team requires authentication', async () => {
    const res = await request(app).get('/api/team');
    expect(res.status).toBe(401);
  });

  it('GET /api/monitoring/overview requires authentication', async () => {
    const res = await request(app).get('/api/monitoring/overview');
    expect(res.status).toBe(401);
  });

  it('GET /api/monitoring/overview returns metrics with valid JWT auth in production mode', async () => {
    const res = await request(app)
      .get('/api/monitoring/overview')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalMonitoredTargets');
    expect(res.body.data).toHaveProperty('runnerClusters');
    expect(Array.isArray(res.body.data.runnerClusters)).toBe(true);
    expect(res.body.data.runnerClusters.length).toBeGreaterThan(0);
  });
});
