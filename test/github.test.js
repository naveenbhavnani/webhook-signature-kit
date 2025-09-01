import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';
import { createHmac } from 'crypto';
describe('GitHub verifier', () => {
    const secret = 'github_secret';
    const rawBody = JSON.stringify({ zen: "Speak like a human." });
    it('verifies SHA-256 signature correctly', async () => {
        const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
        const headers = {
            'X-Hub-Signature-256': `sha256=${sig}`,
            'X-GitHub-Delivery': 'abc123'
        };
        const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
        expect(result.ok).toBe(true);
        expect(result.meta).toEqual({ deliveryId: 'abc123', algo: 'sha256' });
    });
    it('verifies SHA-1 signature when allowSha1 is true', async () => {
        const sig = createHmac('sha1', secret).update(rawBody).digest('hex');
        const headers = {
            'X-Hub-Signature': `sha1=${sig}`,
            'X-GitHub-Delivery': 'def456'
        };
        const result = await verifyWebhook({ provider: 'github', secret, allowSha1: true, headers, rawBody });
        expect(result.ok).toBe(true);
        expect(result.meta).toEqual({ deliveryId: 'def456', algo: 'sha1' });
    });
    it('rejects SHA-1 signature when allowSha1 is false', async () => {
        const sig = createHmac('sha1', secret).update(rawBody).digest('hex');
        const headers = { 'X-Hub-Signature': `sha1=${sig}` };
        const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('missing_header');
    });
    it('fails with missing signature header', async () => {
        const result = await verifyWebhook({ provider: 'github', secret, headers: {}, rawBody });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('missing_header');
    });
    it('fails with invalid SHA-256 signature', async () => {
        const headers = { 'X-Hub-Signature-256': 'sha256=invalid' };
        const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('bad_signature');
    });
    it('works without delivery ID', async () => {
        const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
        const headers = { 'X-Hub-Signature-256': `sha256=${sig}` };
        const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
        expect(result.ok).toBe(true);
        expect(result.meta?.deliveryId).toBeUndefined();
    });
});
