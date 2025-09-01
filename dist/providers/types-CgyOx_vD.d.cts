type Enc = 'hex' | 'base64';
interface VerifyOptionsCommon {
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer | string;
    tolerance?: number;
    allowClockSkew?: boolean;
    replayStore?: ReplayStore;
}
interface VerifyResult<TMeta = any> {
    ok: boolean;
    reason?: 'missing_header' | 'bad_header' | 'bad_signature' | 'timestamp_out_of_tolerance' | 'body_unavailable' | 'secret_unavailable' | 'unsupported_provider' | 'replay_detected';
    message?: string;
    meta?: TMeta;
}
interface ReplayStore {
    putOnce(key: string, ttlSeconds: number): Promise<boolean>;
}
interface GenericHmacConfig {
    secret: string | string[];
    header: string;
    algo: 'sha256' | 'sha1' | 'sha512';
    format: {
        prefix?: string;
        enc: Enc;
        caseInsensitive?: boolean;
    };
    payload: 'raw-body' | 'url+raw-body' | 'raw-body+ts-header';
    tsHeader?: string;
}

export type { GenericHmacConfig as G, VerifyOptionsCommon as V, VerifyResult as a };
