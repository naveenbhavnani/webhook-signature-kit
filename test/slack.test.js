import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';
import { createHmac } from 'crypto';
describe('slack verifier', () => {
    it('verifies v0 signature', async () => {
        const secret = 'slack_secret';
        const ts = Math.floor(Date.now() / 1000);
        const rawBody = 'token=abc&team_id=T123';
        const base = `v0:${ts}:${rawBody}`;
        const sig = createHmac('sha256', secret).update(base).digest('hex');
        const headers = { 'X-Slack-Signature': `v0=${sig}`, 'X-Slack-Request-Timestamp': String(ts) };
        const res = await verifyWebhook({ provider: 'slack', secret, headers, rawBody });
        expect(res.ok).toBe(true);
    });
});
