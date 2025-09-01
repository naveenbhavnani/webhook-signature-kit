import { describe, it, expect } from 'vitest';
import { verifyWebhook } from '../src/index';
import { createHmac } from 'crypto';

describe('Twilio verifier', () => {
  const secret = 'twilio_secret';
  const url = 'https://example.com/webhook';

  describe('JSON payload', () => {
    const rawBody = JSON.stringify({ CallSid: 'CA1234567890ABCDEF', From: '+1234567890' });

    it('verifies JSON webhook signature correctly', async () => {
      const payload = url + rawBody;
      const sig = createHmac('sha1', secret).update(payload).digest('base64');
      const headers = { 'X-Twilio-Signature': sig };
      const result = await verifyWebhook({ provider: 'twilio', secret, url, headers, rawBody });
      expect(result.ok).toBe(true);
    });

    it('fails with missing signature header', async () => {
      const result = await verifyWebhook({ provider: 'twilio', secret, url, headers: {}, rawBody });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_header');
    });

    it('fails with invalid signature', async () => {
      const headers = { 'X-Twilio-Signature': 'invalid_signature' };
      const result = await verifyWebhook({ provider: 'twilio', secret, url, headers, rawBody });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('bad_signature');
    });
  });

  describe('Form-encoded payload', () => {
    const formParams = {
      CallSid: 'CA1234567890ABCDEF',
      From: '+1234567890',
      To: '+0987654321'
    };
    const rawBody = 'CallSid=CA1234567890ABCDEF&From=%2B1234567890&To=%2B0987654321';

    it('verifies form webhook signature correctly', async () => {
      // Twilio concatenates URL + alphabetically sorted params
      const sortedParams = Object.keys(formParams).sort().map(key => `${key}${formParams[key]}`).join('');
      const payload = url + sortedParams;
      const sig = createHmac('sha1', secret).update(payload).digest('base64');
      const headers = { 'X-Twilio-Signature': sig };
      
      const result = await verifyWebhook({ 
        provider: 'twilio', 
        secret, 
        url, 
        formParams, 
        headers, 
        rawBody 
      });
      expect(result.ok).toBe(true);
    });

    it('fails with incorrect form params', async () => {
      const payload = url + rawBody; // Wrong - should use form params
      const sig = createHmac('sha1', secret).update(payload).digest('base64');
      const headers = { 'X-Twilio-Signature': sig };
      
      const result = await verifyWebhook({ 
        provider: 'twilio', 
        secret, 
        url, 
        formParams, 
        headers, 
        rawBody 
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('bad_signature');
    });
  });

  it('supports key rotation with multiple secrets', async () => {
    const oldSecret = 'old_secret';
    const newSecret = 'new_secret';
    const rawBody = JSON.stringify({ test: 'data' });
    const payload = url + rawBody;
    const sig = createHmac('sha1', newSecret).update(payload).digest('base64');
    const headers = { 'X-Twilio-Signature': sig };
    
    const result = await verifyWebhook({ 
      provider: 'twilio', 
      secret: [oldSecret, newSecret], 
      url, 
      headers, 
      rawBody 
    });
    expect(result.ok).toBe(true);
  });
});