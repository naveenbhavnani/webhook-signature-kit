// src/replay/memory.ts
var MemoryReplayStore = class {
  constructor(maxEntries = 1e4) {
    this.max = maxEntries;
    this.map = /* @__PURE__ */ new Map();
  }
  async putOnce(key, ttlSeconds) {
    const now = Date.now();
    if (this.map.size > this.max) {
      const cutoff = now;
      for (const [k, v] of this.map) if (v.expires <= cutoff) this.map.delete(k);
      while (this.map.size > this.max) {
        const firstKey = this.map.keys().next().value;
        if (firstKey !== void 0) {
          this.map.delete(firstKey);
        } else {
          break;
        }
      }
    }
    const existing = this.map.get(key);
    if (existing && existing.expires > now) return false;
    this.map.set(key, { expires: now + ttlSeconds * 1e3 });
    return true;
  }
};
export {
  MemoryReplayStore
};
