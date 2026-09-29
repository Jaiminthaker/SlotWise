import request from 'supertest';
import app from '../app.js';

describe('API shell', () => {
  it('reports a healthy API', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns the documented validation error shape', async () => {
    const response = await request(app).post('/api/auth/register').send({});
    expect(response.status).toBe(422);
    expect(response.body.error).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR', message: expect.any(String) }));
  });

  it('requires a session for protected endpoints', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('validates forgot-password email input', async () => {
    const response = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates reset-password input before token lookup', async () => {
    const response = await request(app).post('/api/auth/reset-password').send({ token: 'short', password: 'short' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});