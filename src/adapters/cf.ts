import { verifyWebhook } from '../index.js';
import type { VerifyWebhookOptions } from '../types';

export async function cfVerify(request: Request, opts: Omit<VerifyWebhookOptions,'headers'|'rawBody'>) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers) as Record<string,string>;
  const result = await verifyWebhook({ ...(opts as any), headers, rawBody });
  return result;
}
