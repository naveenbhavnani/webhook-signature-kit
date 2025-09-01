import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';
import { createHmac } from 'crypto';

describe('Edge cases and error handling', () => {
  describe('Timestamp tolerance', () => {
    it('accepts timestamps within tolerance for Stripe', async () => {
      const secret = 'stripe_secret';
      const t = Math.floor(Date.now() / 1000) - 200; // 200 seconds ago
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
      const headers = { 'Stripe-Signature': `t=${t},v1=${sig}` };

      const result = await verifyWebhook({ 
        provider: 'stripe', 
        secret, 
        headers, 
        rawBody,
        tolerance: 300 // 5 minutes
      });
      expect(result.ok).toBe(true);
    });

    it('rejects timestamps outside tolerance for Stripe', async () => {
      const secret = 'stripe_secret';
      const t = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
      const headers = { 'Stripe-Signature': `t=${t},v1=${sig}` };

      const result = await verifyWebhook({ 
        provider: 'stripe', 
        secret, 
        headers, 
        rawBody,
        tolerance: 300 // 5 minutes
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('timestamp_out_of_tolerance');
    });

    it('accepts timestamps within tolerance for Slack', async () => {
      const secret = 'slack_secret';
      const ts = Math.floor(Date.now() / 1000) - 200; // 200 seconds ago
      const rawBody = 'token=abc&team_id=T123';
      const base = `v0:${ts}:${rawBody}`;
      const sig = createHmac('sha256', secret).update(base).digest('hex');
      const headers = { 
        'X-Slack-Signature': `v0=${sig}`, 
        'X-Slack-Request-Timestamp': String(ts) 
      };

      const result = await verifyWebhook({ 
        provider: 'slack', 
        secret, 
        headers, 
        rawBody,
        tolerance: 300
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('Malformed headers', () => {
    it('handles malformed Stripe-Signature header', async () => {
      const secret = 'stripe_secret';
      const rawBody = '{"test": "data"}';
      
      // Missing t= part
      const headers1 = { 'Stripe-Signature': 'v1=abcd1234' };
      const result1 = await verifyWebhook({ provider: 'stripe', secret, headers: headers1, rawBody });
      expect(result1.ok).toBe(false);
      expect(result1.reason).toBe('bad_header');

      // Missing v1= part
      const headers2 = { 'Stripe-Signature': 't=1234567890' };
      const result2 = await verifyWebhook({ provider: 'stripe', secret, headers: headers2, rawBody });
      expect(result2.ok).toBe(false);
      expect(result2.reason).toBe('bad_header');

      // Invalid timestamp
      const headers3 = { 'Stripe-Signature': 't=invalid,v1=abcd1234' };
      const result3 = await verifyWebhook({ provider: 'stripe', secret, headers: headers3, rawBody });
      expect(result3.ok).toBe(false);
      expect(result3.reason).toBe('bad_header');
    });

    it('handles malformed Slack headers', async () => {
      const secret = 'slack_secret';
      const rawBody = 'token=abc';
      
      // Invalid signature format
      const headers1 = { 
        'X-Slack-Signature': 'invalid_format', 
        'X-Slack-Request-Timestamp': '1234567890' 
      };
      const result1 = await verifyWebhook({ provider: 'slack', secret, headers: headers1, rawBody });
      expect(result1.ok).toBe(false);
      expect(result1.reason).toBe('bad_header');

      // Invalid timestamp
      const headers2 = { 
        'X-Slack-Signature': 'v0=abcd1234', 
        'X-Slack-Request-Timestamp': 'invalid' 
      };
      const result2 = await verifyWebhook({ provider: 'slack', secret, headers: headers2, rawBody });
      expect(result2.ok).toBe(false);
      expect(result2.reason).toBe('bad_header');
    });
  });

  describe('Different body formats', () => {
    it('handles empty body', async () => {
      const secret = 'github_secret';
      const rawBody = '';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
      const headers = { 'X-Hub-Signature-256': `sha256=${sig}` };

      const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
      expect(result.ok).toBe(true);
    });

    it('handles Unicode characters in body', async () => {
      const secret = 'github_secret';
      const rawBody = '{"message": "Hello 世界 🌍"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
      const headers = { 'X-Hub-Signature-256': `sha256=${sig}` };

      const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
      expect(result.ok).toBe(true);
    });

    it('handles Buffer vs string consistency', async () => {
      const secret = 'shopify_secret';
      const bodyString = '{"test": "data"}';
      const bodyBuffer = Buffer.from(bodyString, 'utf8');
      
      // Generate signature with buffer
      const sig = createHmac('sha256', secret).update(bodyBuffer).digest('base64');
      const headers = { 'X-Shopify-Hmac-Sha256': sig };

      // Verify with string
      const result1 = await verifyWebhook({ provider: 'shopify', secret, headers, rawBody: bodyString });
      expect(result1.ok).toBe(true);

      // Verify with buffer
      const result2 = await verifyWebhook({ provider: 'shopify', secret, headers, rawBody: bodyBuffer });
      expect(result2.ok).toBe(true);
    });
  });

  describe('Header case sensitivity', () => {
    it('handles case-insensitive header lookup', async () => {
      const secret = 'github_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
      
      // Different case variations
      const testCases = [
        { 'x-hub-signature-256': `sha256=${sig}` },
        { 'X-HUB-SIGNATURE-256': `sha256=${sig}` },
        { 'X-Hub-Signature-256': `sha256=${sig}` },
        { 'x-HuB-sIgNaTuRe-256': `sha256=${sig}` }
      ];

      for (const headers of testCases) {
        const result = await verifyWebhook({ provider: 'github', secret, headers, rawBody });
        expect(result.ok).toBe(true);
      }
    });
  });

  describe('Key rotation edge cases', () => {
    it('tries all secrets until one matches', async () => {
      const secrets = ['secret1', 'secret2', 'secret3'];
      const rawBody = '{"test": "data"}';
      const correctSecret = secrets[2];
      const sig = createHmac('sha256', correctSecret).update(rawBody).digest('hex');
      const headers = { 'X-Hub-Signature-256': `sha256=${sig}` };

      const result = await verifyWebhook({ provider: 'github', secret: secrets, headers, rawBody });
      expect(result.ok).toBe(true);
    });

    it('fails if no secrets match', async () => {
      const secrets = ['secret1', 'secret2', 'secret3'];
      const rawBody = '{"test": "data"}';
      const wrongSecret = 'wrong_secret';
      const sig = createHmac('sha256', wrongSecret).update(rawBody).digest('hex');
      const headers = { 'X-Hub-Signature-256': `sha256=${sig}` };

      const result = await verifyWebhook({ provider: 'github', secret: secrets, headers, rawBody });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('bad_signature');
    });
  });

  describe('Unsupported provider', () => {
    it('returns error for unsupported provider', async () => {
      const result = await verifyWebhook({ 
        provider: 'unsupported' as any, 
        secret: 'test', 
        headers: {}, 
        rawBody: '{}' 
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('unsupported_provider');
    });
  });

  describe('Multiple v1 signatures in Stripe header', () => {
    it('accepts if any v1 signature matches', async () => {
      const secret = 'stripe_secret';
      const t = Math.floor(Date.now() / 1000);
      const rawBody = '{"test": "data"}';
      const correctSig = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
      const wrongSig = 'wrong_signature';
      
      // Multiple v1 signatures, one correct
      const headers = { 'Stripe-Signature': `t=${t},v1=${wrongSig},v1=${correctSig}` };

      const result = await verifyWebhook({ provider: 'stripe', secret, headers, rawBody });
      expect(result.ok).toBe(true);
    });
  });
});