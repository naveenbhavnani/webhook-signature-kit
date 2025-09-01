import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';

const secret = 'whsec_test';

describe('stripe verifier', () => {
  it('verifies a valid signature', async () => {
    const t = Math.floor(Date.now()/1000);
    const rawBody = JSON.stringify({ hello: 'world' });
    const crypto = await import('crypto');
    const sig = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
    const headers = { 'Stripe-Signature': `t=${t},v1=${sig}` };
    const res = await verifyWebhook({ provider:'stripe', secret, headers, rawBody });
    expect(res.ok).toBe(true);
  });
});
