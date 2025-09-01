import type { IncomingMessage, ServerResponse } from 'http';
import { verifyWebhook } from '../index.js';
import type { VerifyWebhookOptions } from '../types';

export async function nextVerify(req: IncomingMessage, res: ServerResponse, opts: Omit<VerifyWebhookOptions,'headers'|'rawBody'>) {
  const rawBody = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c)?c:Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
  const headers = (req.headers || {}) as Record<string,string|string[]>;
  const result = await verifyWebhook({ ...(opts as any), headers, rawBody });
  return result;
}
