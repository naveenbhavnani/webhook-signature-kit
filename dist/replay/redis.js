// src/replay/redis.ts
var RedisReplayStore = class {
  constructor(client, keyPrefix = "wh-replay:") {
    this.client = client;
    this.keyPrefix = keyPrefix;
  }
  async putOnce(key, ttlSeconds) {
    const full = this.keyPrefix + key;
    const res = await this.client.set(full, "1", "NX", "EX", ttlSeconds);
    return res === "OK";
  }
};
export {
  RedisReplayStore
};
