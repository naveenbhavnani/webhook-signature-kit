import { R as ReplayStore } from './types-COE--Zx0.js';

declare class MemoryReplayStore implements ReplayStore {
    private max;
    private map;
    constructor(maxEntries?: number);
    putOnce(key: string, ttlSeconds: number): Promise<boolean>;
}

export { MemoryReplayStore };
