import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisReplayStore } from '../src/replay/redis';

// Mock ioredis
const mockRedis = {
  set: vi.fn(),
};

vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedis)
}));

describe('RedisReplayStore', () => {
  let store: RedisReplayStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new RedisReplayStore(mockRedis as any);
  });

  it('allows first occurrence of a key', async () => {
    mockRedis.set.mockResolvedValue('OK');
    
    const result = await store.putOnce('test-key', 300);
    
    expect(result).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('wh-replay:test-key', '1', 'NX', 'EX', 300);
  });

  it('rejects duplicate keys', async () => {
    mockRedis.set.mockResolvedValue(null); // Redis returns null when NX fails
    
    const result = await store.putOnce('test-key', 300);
    
    expect(result).toBe(false);
    expect(mockRedis.set).toHaveBeenCalledWith('wh-replay:test-key', '1', 'NX', 'EX', 300);
  });

  it('uses custom key prefix', () => {
    const customStore = new RedisReplayStore(mockRedis as any, 'custom-prefix:');
    mockRedis.set.mockResolvedValue('OK');
    
    customStore.putOnce('test-key', 300);
    
    expect(mockRedis.set).toHaveBeenCalledWith('custom-prefix:test-key', '1', 'NX', 'EX', 300);
  });

  it('uses default key prefix when not provided', () => {
    mockRedis.set.mockResolvedValue('OK');
    
    store.putOnce('test-key', 300);
    
    expect(mockRedis.set).toHaveBeenCalledWith('wh-replay:test-key', '1', 'NX', 'EX', 300);
  });
});