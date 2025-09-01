import type { Request, Response, RequestHandler } from 'express';
import { verifyWebhook } from '../index.js';
import type { Provider, GenericHmacConfig, ReplayStore } from '../types';

export function expressMiddleware(route: {
  provider: Provider;
  secret?: string | string[];
  token?: string | string[];
  config?: GenericHmacConfig;
  tolerance?: number;
  replayStore?: ReplayStore;
  onVerified?: (ctx: { req: Request; rawBody: Buffer; headers: Record<string,string|string[]> }) => Promise<void> | void;
}): RequestHandler {
  return async function handler(req: Request, res: Response) {
    try {
      const raw = (req as any).rawBody || (req as any).body?.raw || undefined;
      if (!raw) return res.status(400).json({ ok:false, reason:'body_unavailable', message:'Raw body not found. See README for capture recipe.' });
      const headers: Record<string,string|string[]> = req.headers as any;
      const provider = route.provider;
      const opts: any = { provider, headers, rawBody: raw, tolerance: route.tolerance, replayStore: route.replayStore };
      if (provider === 'generic-hmac') opts.config = route.config;
      else if (provider === 'gitlab') opts.token = route.token;
      else opts.secret = route.secret;
      const result = await verifyWebhook(opts);
      if (!result.ok) return res.status(401).json(result);
      await route.onVerified?.({ req, rawBody: raw, headers });
      return res.status(200).end('ok');
    } catch (e: any) {
      return res.status(500).json({ ok:false, reason:'unsupported_provider', message: e?.message || 'error' });
    }
  };
}
