import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyWebhook } from '../index.js';
import type { Provider, GenericHmacConfig, ReplayStore } from '../types';

export async function fastifyPlugin(instance: FastifyInstance, opts: {
  provider: Provider;
  secret?: string | string[];
  token?: string | string[];
  config?: GenericHmacConfig;
  tolerance?: number;
  replayStore?: ReplayStore;
  onVerified?: (ctx: { req: FastifyRequest; rawBody: Buffer; headers: Record<string, string | string[]> }) => Promise<void> | void;
}): Promise<void> {
  instance.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const raw = (request as any).rawBody || (request as any).body?.raw || undefined;
      if (!raw) {
        reply.status(400).send({ 
          ok: false, 
          reason: 'body_unavailable', 
          message: 'Raw body not found. See README for capture recipe.' 
        });
        return;
      }

      const headers: Record<string, string | string[]> = request.headers as any;
      const provider = opts.provider;
      const verifyOpts: any = { 
        provider, 
        headers, 
        rawBody: raw, 
        tolerance: opts.tolerance, 
        replayStore: opts.replayStore 
      };

      if (provider === 'generic-hmac') {
        verifyOpts.config = opts.config;
      } else if (provider === 'gitlab') {
        verifyOpts.token = opts.token;
      } else {
        verifyOpts.secret = opts.secret;
      }

      const result = await verifyWebhook(verifyOpts);
      if (!result.ok) {
        reply.status(401).send(result);
        return;
      }

      await opts.onVerified?.({ req: request, rawBody: raw, headers });
      reply.status(200).send('ok');
    } catch (e: any) {
      reply.status(500).send({ 
        ok: false, 
        reason: 'unsupported_provider', 
        message: e?.message || 'error' 
      });
    }
  });
}