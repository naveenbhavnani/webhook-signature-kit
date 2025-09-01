interface ReplayStore {
    putOnce(key: string, ttlSeconds: number): Promise<boolean>;
}

export type { ReplayStore as R };
