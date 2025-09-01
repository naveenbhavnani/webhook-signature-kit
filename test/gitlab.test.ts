import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';

describe('GitLab verifier', () => {
  const token = 'gitlab_secret_token';
  const rawBody = JSON.stringify({ object_kind: 'push', project: { name: 'test' } });

  it('verifies token correctly', async () => {
    const headers = { 'X-Gitlab-Token': token };
    const result = await verifyWebhook({ provider: 'gitlab', token, headers, rawBody });
    expect(result.ok).toBe(true);
  });

  it('fails with missing token header', async () => {
    const result = await verifyWebhook({ provider: 'gitlab', token, headers: {}, rawBody });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('missing_header');
  });

  it('fails with incorrect token', async () => {
    const headers = { 'X-Gitlab-Token': 'wrong_token' };
    const result = await verifyWebhook({ provider: 'gitlab', token, headers, rawBody });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('bad_signature');
  });

  it('handles case-insensitive headers', async () => {
    const headers = { 'x-gitlab-token': token };
    const result = await verifyWebhook({ provider: 'gitlab', token, headers, rawBody });
    expect(result.ok).toBe(true);
  });

  it('supports multiple tokens for rotation', async () => {
    const oldToken = 'old_token';
    const newToken = 'new_token';
    const headers = { 'X-Gitlab-Token': newToken };
    const result = await verifyWebhook({ provider: 'gitlab', token: [oldToken, newToken], headers, rawBody });
    expect(result.ok).toBe(true);
  });

  it('works with empty rawBody', async () => {
    const headers = { 'X-Gitlab-Token': token };
    const result = await verifyWebhook({ provider: 'gitlab', token, headers, rawBody: '' });
    expect(result.ok).toBe(true);
  });
});