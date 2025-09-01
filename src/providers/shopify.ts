import { VerifyOptionsCommon, VerifyResult } from '../types';
import { getHeader, hmac, constTimeEqualStr, toBuffer } from '../utils';

export async function verifyShopify(opts: { secret: string, common: VerifyOptionsCommon }): Promise<VerifyResult> {
  const { headers, rawBody } = opts.common;
  const hdr = getHeader(headers, 'X-Shopify-Hmac-Sha256');
  if (!hdr) return { ok: false, reason: 'missing_header', message: 'X-Shopify-Hmac-Sha256 missing' };
  const expected = hmac('sha256', opts.secret, toBuffer(rawBody), 'base64');
  const provided = hdr.trim();
  if (constTimeEqualStr(provided, expected)) return { ok: true };
  return { ok: false, reason: 'bad_signature', message: 'Signature mismatch' };
}
