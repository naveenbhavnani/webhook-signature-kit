import { R as ReplayStore } from './types-COE--Zx0.cjs';

declare class MemoryReplayStore implements ReplayStore {
    private max;
    private map;
    constructor(maxEntries?: number);
    putOnce(key: string, ttlSeconds: number): Promise<boolean>;
}

export { MemoryReplayStore };
