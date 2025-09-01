import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyWebhook } from '../src/index';
import { MemoryReplayStore } from '../src/replay/memory';
import { createHmac } from 'crypto';

describe('Replay protection', () => {
  let replayStore: MemoryReplayStore;

  beforeEach(() => {
    replayStore = new MemoryReplayStore();
  });

  describe('MemoryReplayStore', () => {
    it('allows first occurrence of a key', async () => {
      const result = await replayStore.putOnce('test-key', 300);
      expect(result).toBe(true);
    });

    it('rejects duplicate keys', async () => {
      await replayStore.putOnce('test-key', 300);
      const result = await replayStore.putOnce('test-key', 300);
      expect(result).toBe(false);
    });

    it('expires keys after TTL', async () => {
      // Mock Date.now to control time
      const mockNow = vi.spyOn(Date, 'now');
      const startTime = 1000000;
      mockNow.mockReturnValue(startTime);

      await replayStore.putOnce('test-key', 1); // 1 second TTL

      // Move time forward by 2 seconds
      mockNow.mockReturnValue(startTime + 2000);
      
      const result = await replayStore.putOnce('test-key', 1);
      expect(result).toBe(true);

      mockNow.mockRestore();
    });

    it('enforces max entries limit', async () => {
      const smallStore = new MemoryReplayStore(2);
      
      await smallStore.putOnce('key1', 300);
      await smallStore.putOnce('key2', 300);
      await smallStore.putOnce('key3', 300); // Should evict oldest
      
      // key1 should be evicted, so it should be allowed again
      const result = await smallStore.putOnce('key1', 300);
      expect(result).toBe(true);
    });
  });

  describe('Integration with webhook verification', () => {
    it('prevents replay attacks for Stripe', async () => {
      const secret = 'stripe_secret';
      const t = Math.floor(Date.now() / 1000);
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
      const headers = { 'Stripe-Signature': `t=${t},v1=${sig}` };

      // First request should succeed
      const result1 = await verifyWebhook({ 
        provider: 'stripe', 
        secret, 
        headers, 
        rawBody,
        replayStore 
      });
      expect(result1.ok).toBe(true);

      // Replay should be rejected
      const result2 = await verifyWebhook({ 
        provider: 'stripe', 
        secret, 
        headers, 
        rawBody,
        replayStore 
      });
      expect(result2.ok).toBe(false);
      expect(result2.reason).toBe('replay_detected');
    });

    it('prevents replay attacks for Slack', async () => {
      const secret = 'slack_secret';
      const ts = Math.floor(Date.now() / 1000);
      const rawBody = 'token=abc&team_id=T123';
      const base = `v0:${ts}:${rawBody}`;
      const sig = createHmac('sha256', secret).update(base).digest('hex');
      const headers = { 
        'X-Slack-Signature': `v0=${sig}`, 
        'X-Slack-Request-Timestamp': String(ts) 
      };

      // First request should succeed
      const result1 = await verifyWebhook({ 
        provider: 'slack', 
        secret, 
        headers, 
        rawBody,
        replayStore 
      });
      expect(result1.ok).toBe(true);

      // Replay should be rejected
      const result2 = await verifyWebhook({ 
        provider: 'slack', 
        secret, 
        headers, 
        rawBody,
        replayStore 
      });
      expect(result2.ok).toBe(false);
      expect(result2.reason).toBe('replay_detected');
    });

    it('works without replay store', async () => {
      const secret = 'stripe_secret';
      const t = Math.floor(Date.now() / 1000);
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
      const headers = { 'Stripe-Signature': `t=${t},v1=${sig}` };

      // Both requests should succeed without replay store
      const result1 = await verifyWebhook({ 
        provider: 'stripe', 
        secret, 
        headers, 
        rawBody 
      });
      expect(result1.ok).toBe(true);

      const result2 = await verifyWebhook({ 
        provider: 'stripe', 
        secret, 
        headers, 
        rawBody 
      });
      expect(result2.ok).toBe(true);
    });
  });
});