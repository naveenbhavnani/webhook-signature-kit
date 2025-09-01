import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';
import { createHmac } from 'crypto';
describe('Shopify verifier', () => {
    const secret = 'shopify_secret';
    const rawBody = JSON.stringify({ id: 1, name: 'Order #1001' });
    it('verifies signature correctly', async () => {
        const sig = createHmac('sha256', secret).update(rawBody).digest('base64');
        const headers = { 'X-Shopify-Hmac-Sha256': sig };
        const result = await verifyWebhook({ provider: 'shopify', secret, headers, rawBody });
        expect(result.ok).toBe(true);
    });
    it('fails with missing signature header', async () => {
        const result = await verifyWebhook({ provider: 'shopify', secret, headers: {}, rawBody });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('missing_header');
    });
    it('fails with invalid signature', async () => {
        const headers = { 'X-Shopify-Hmac-Sha256': 'invalid_signature' };
        const result = await verifyWebhook({ provider: 'shopify', secret, headers, rawBody });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('bad_signature');
    });
    it('works with Buffer rawBody', async () => {
        const bodyBuffer = Buffer.from(rawBody, 'utf8');
        const sig = createHmac('sha256', secret).update(bodyBuffer).digest('base64');
        const headers = { 'X-Shopify-Hmac-Sha256': sig };
        const result = await verifyWebhook({ provider: 'shopify', secret, headers, rawBody: bodyBuffer });
        expect(result.ok).toBe(true);
    });
    it('supports key rotation with multiple secrets', async () => {
        const oldSecret = 'old_secret';
        const newSecret = 'new_secret';
        const sig = createHmac('sha256', newSecret).update(rawBody).digest('base64');
        const headers = { 'X-Shopify-Hmac-Sha256': sig };
        const result = await verifyWebhook({ provider: 'shopify', secret: [oldSecret, newSecret], headers, rawBody });
        expect(result.ok).toBe(true);
    });
    it('handles case-insensitive headers', async () => {
        const sig = createHmac('sha256', secret).update(rawBody).digest('base64');
        const headers = { 'x-shopify-hmac-sha256': sig };
        const result = await verifyWebhook({ provider: 'shopify', secret, headers, rawBody });
        expect(result.ok).toBe(true);
    });
});
