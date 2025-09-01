import type { VerifyWebhookOptions } from '../types';
import { verifyWebhook } from '../index.js';

export async function awsLambdaVerify(event: any, opts: Omit<VerifyWebhookOptions,'headers'|'rawBody'>) {
  const headers = (event.headers || {}) as Record<string,string|string[]>;
  const isB64 = !!event.isBase64Encoded;
  const rawBody: Buffer = Buffer.from(event.body ?? '', isB64 ? 'base64' : 'utf8');
  return verifyWebhook({ ...(opts as any), headers, rawBody });
}
