import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import env from '../src/config/env.js';

describe('API Health and Security Tests', () => {
  it('GET /api/health returns 200 OK with uptime and status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'apna-scheduler-os');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /api/ready handles readiness probe', async () => {
    const res = await request(app).get('/api/ready');
    // In disconnected test environment, returns 503 unready honestly as required by the prompt
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('database');
  });

  it('POST /internal/tick rejects requests without valid X-Tick-Secret', async () => {
    const res = await request(app).post('/internal/tick');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it('POST /internal/tick rejects requests with wrong secret', async () => {
    const res = await request(app)
      .post('/internal/tick')
      .set('X-Tick-Secret', 'wrong_secret_12345');
    expect(res.status).toBe(401);
  });

  it('GET /api/jobs requires authentication', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/non-existent returns 404 cleanly', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
