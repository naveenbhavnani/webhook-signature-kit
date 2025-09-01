import { R as ReplayStore } from './types-COE--Zx0.cjs';

declare class RedisReplayStore implements ReplayStore {
    private client;
    private keyPrefix;
    constructor(client: any, keyPrefix?: string);
    putOnce(key: string, ttlSeconds: number): Promise<boolean>;
}

export { RedisReplayStore };
