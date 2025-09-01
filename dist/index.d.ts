type Provider = 'stripe' | 'slack' | 'github' | 'razorpay' | 'shopify' | 'twilio' | 'gitlab' | 'generic-hmac';
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
type VerifyWebhookOptions = ({
    provider: 'stripe';
    secret: string | string[];
} & VerifyOptionsCommon) | ({
    provider: 'slack';
    secret: string | string[];
} & VerifyOptionsCommon) | ({
    provider: 'github';
    secret: string | string[];
    allowSha1?: boolean;
} & VerifyOptionsCommon) | ({
    provider: 'razorpay';
    secret: string | string[];
} & VerifyOptionsCommon) | ({
    provider: 'shopify';
    secret: string | string[];
} & VerifyOptionsCommon) | ({
    provider: 'twilio';
    secret: string | string[];
    url: string;
    formParams?: Record<string, string>;
} & VerifyOptionsCommon) | ({
    provider: 'gitlab';
    token: string | string[];
} & VerifyOptionsCommon) | ({
    provider: 'generic-hmac';
    config: GenericHmacConfig;
} & VerifyOptionsCommon);
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

declare function verifyWebhook(opts: VerifyWebhookOptions): Promise<VerifyResult>;

export { type Enc, type GenericHmacConfig, type Provider, type ReplayStore, type VerifyOptionsCommon, type VerifyResult, type VerifyWebhookOptions, verifyWebhook };
