import { ReplayStore } from '../types';

type Entry = { expires: number };
export class MemoryReplayStore implements ReplayStore {
  private max: number;
  private map: Map<string, Entry>;
  constructor(maxEntries = 10000) { this.max = maxEntries; this.map = new Map(); }
  async putOnce(key: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    // purge expired occasionally
    if (this.map.size > this.max) {
      const cutoff = now;
      for (const [k,v] of this.map) if (v.expires <= cutoff) this.map.delete(k);
      // if still large, delete oldest
      while (this.map.size > this.max) {
        const firstKey = this.map.keys().next().value;
        if (firstKey !== undefined) {
          this.map.delete(firstKey);
        } else {
          break;
        }
      }
    }
    const existing = this.map.get(key);
    if (existing && existing.expires > now) return false;
    this.map.set(key, { expires: now + ttlSeconds * 1000 });
    return true;
  }
}
