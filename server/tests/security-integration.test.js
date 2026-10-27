import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { signToken } from '../src/utils/crypto.js';

describe('Security & Multi-Tenant Integration Tests', () => {
  const userToken = signToken({ userId: '65f1234567890abcdef12345', role: 'user' });
  const adminToken = signToken({ userId: '65f1234567890abcdef12346', role: 'admin' });

  describe('Authentication & Auth Bypass Protections', () => {
    it('POST /api/auth/google rejects unverified raw email payloads without credential', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ email: 'admin@target.com' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Google ID token or credential is required/i);
    });

    it('POST /api/auth/google rejects bogus or forged credential tokens', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'fake_forged_google_jwt_token_123456' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid or expired Google credential/i);
    });
  });

  describe('ReDoS and Query Injection Protections', () => {
    it('escapes dangerous regex metacharacters properly', async () => {
      const { escapeRegex } = await import('../src/routes/jobRoutes.js');
      expect(escapeRegex('((((a+)+)+)+)')).toBe('\\(\\(\\(\\(a\\+\\)\\+\\)\\+\\)\\+\\)');
      expect(escapeRegex('.*^$')).toBe('\\.\\*\\^\\$');
      expect(escapeRegex('safe-string_123')).toBe('safe-string_123');
    });

    it('GET /api/jobs handles complex and malicious regex patterns safely without throwing 500', async () => {
      const maliciousPatterns = [
        '((((a+)+)+)+)',
        '[*+?^${}()|[\\]\\\\]',
        '[a-z',
        '*(.*',
      ];

      for (const pattern of maliciousPatterns) {
        const res = await request(app)
          .get(`/api/jobs?search=${encodeURIComponent(pattern)}`)
          .set('Authorization', `Bearer ${userToken}`);

        // Must not crash with 500 Internal Server Error
        expect(res.status).not.toBe(500);
      }
    });
  });

  describe('Tenant Scoping & Access Control', () => {
    it('GET /api/executions enforces authentication', async () => {
      const res = await request(app).get('/api/executions');
      expect(res.status).toBe(401);
    });

    it('GET /api/audit-logs enforces authentication', async () => {
      const res = await request(app).get('/api/audit-logs');
      expect(res.status).toBe(401);
    });

    it('DELETE /api/executions/purge requires authentication', async () => {
      const res = await request(app).delete('/api/executions/purge');
      expect(res.status).toBe(401);
    });
  });
});
