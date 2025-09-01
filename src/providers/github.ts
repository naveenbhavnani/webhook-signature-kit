import { VerifyOptionsCommon, VerifyResult } from '../types';
import { getHeader, hmac, constTimeEqualStr, toBuffer } from '../utils';

type Meta = { deliveryId?: string; algo: 'sha256' | 'sha1' };

export async function verifyGitHub(opts: { secret: string, allowSha1?: boolean, common: VerifyOptionsCommon }): Promise<VerifyResult<Meta>> {
  const { headers, rawBody } = opts.common;
  const h256 = getHeader(headers, 'X-Hub-Signature-256');
  const hSha1 = getHeader(headers, 'X-Hub-Signature');
  const deliveryId = getHeader(headers, 'X-GitHub-Delivery');
  if (!h256 && !(opts.allowSha1 && hSha1)) return { ok: false, reason: 'missing_header', message: 'Missing GitHub signature header' };
  const body = toBuffer(rawBody);
  if (h256) {
    const provided = h256.replace(/^sha256=/, '').trim();
    const expected = hmac('sha256', opts.secret, body, 'hex');
    if (constTimeEqualStr(provided, expected)) return { ok: true, meta: { deliveryId, algo: 'sha256' } };
    return { ok: false, reason: 'bad_signature', message: 'SHA-256 mismatch', meta: { deliveryId, algo: 'sha256' } };
  }
  // fallback sha1
  const provided = (hSha1 || '').replace(/^sha1=/, '').trim();
  const expected = hmac('sha1', opts.secret, body, 'hex');
  if (constTimeEqualStr(provided, expected)) return { ok: true, meta: { deliveryId, algo: 'sha1' } };
  return { ok: false, reason: 'bad_signature', message: 'SHA-1 mismatch', meta: { deliveryId, algo: 'sha1' } };
}
