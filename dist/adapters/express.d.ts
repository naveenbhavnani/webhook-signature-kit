import { Request, RequestHandler } from 'express';
import { P as Provider, G as GenericHmacConfig, R as ReplayStore } from './types-BSqyom2b.js';

declare function expressMiddleware(route: {
    provider: Provider;
    secret?: string | string[];
    token?: string | string[];
    config?: GenericHmacConfig;
    tolerance?: number;
    replayStore?: ReplayStore;
    onVerified?: (ctx: {
        req: Request;
        rawBody: Buffer;
        headers: Record<string, string | string[]>;
    }) => Promise<void> | void;
}): RequestHandler;

export { expressMiddleware };
