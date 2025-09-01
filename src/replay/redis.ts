import { ReplayStore } from '../types';

export class RedisReplayStore implements ReplayStore {
  constructor(private client: any, private keyPrefix: string = 'wh-replay:') {}
  async putOnce(key: string, ttlSeconds: number): Promise<boolean> {
    const full = this.keyPrefix + key;
    // SET key value NX EX ttl
    const res = await this.client.set(full, '1', 'NX', 'EX', ttlSeconds);
    return res === 'OK';
  }
}
