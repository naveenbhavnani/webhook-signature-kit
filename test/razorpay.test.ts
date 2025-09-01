import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';
import { createHmac } from 'crypto';

describe('Razorpay verifier', () => {
  const secret = 'razorpay_secret';
  const rawBody = JSON.stringify({ entity: 'event', event: 'payment.captured' });

  it('verifies signature correctly', async () => {
    const sig = createHmac('sha256', secret).update(rawBody).digest('base64');
    const headers = { 'X-Razorpay-Signature': sig };
    const result = await verifyWebhook({ provider: 'razorpay', secret, headers, rawBody });
    expect(result.ok).toBe(true);
  });

  it('fails with missing signature header', async () => {
    const result = await verifyWebhook({ provider: 'razorpay', secret, headers: {}, rawBody });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('missing_header');
  });

  it('fails with invalid signature', async () => {
    const headers = { 'X-Razorpay-Signature': 'invalid_signature' };
    const result = await verifyWebhook({ provider: 'razorpay', secret, headers, rawBody });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('bad_signature');
  });

  it('works with Buffer rawBody', async () => {
    const bodyBuffer = Buffer.from(rawBody, 'utf8');
    const sig = createHmac('sha256', secret).update(bodyBuffer).digest('base64');
    const headers = { 'X-Razorpay-Signature': sig };
    const result = await verifyWebhook({ provider: 'razorpay', secret, headers, rawBody: bodyBuffer });
    expect(result.ok).toBe(true);
  });

  it('supports key rotation with multiple secrets', async () => {
    const oldSecret = 'old_secret';
    const newSecret = 'new_secret';
    const sig = createHmac('sha256', newSecret).update(rawBody).digest('base64');
    const headers = { 'X-Razorpay-Signature': sig };
    const result = await verifyWebhook({ provider: 'razorpay', secret: [oldSecret, newSecret], headers, rawBody });
    expect(result.ok).toBe(true);
  });
});