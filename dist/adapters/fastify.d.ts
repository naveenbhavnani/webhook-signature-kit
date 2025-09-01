import { FastifyInstance, FastifyRequest } from 'fastify';
import { P as Provider, G as GenericHmacConfig, R as ReplayStore } from './types-BSqyom2b.js';

declare function fastifyPlugin(instance: FastifyInstance, opts: {
    provider: Provider;
    secret?: string | string[];
    token?: string | string[];
    config?: GenericHmacConfig;
    tolerance?: number;
    replayStore?: ReplayStore;
    onVerified?: (ctx: {
        req: FastifyRequest;
        rawBody: Buffer;
        headers: Record<string, string | string[]>;
    }) => Promise<void> | void;
}): Promise<void>;

export { fastifyPlugin };
