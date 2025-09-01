import { VerifyOptionsCommon, VerifyResult } from '../types';
import { getHeader, hmac, constTimeEqualStr } from '../utils';

export async function verifyTwilio(opts: { secret: string, url: string, formParams?: Record<string,string>, common: VerifyOptionsCommon }): Promise<VerifyResult> {
  const { headers, rawBody } = opts.common;
  const sig = getHeader(headers, 'X-Twilio-Signature');
  if (!sig) return { ok: false, reason: 'missing_header', message: 'X-Twilio-Signature missing' };
  let base: string;
  if (opts.formParams && Object.keys(opts.formParams).length > 0) {
    const sortedKeys = Object.keys(opts.formParams).sort();
    base = opts.url + sortedKeys.map(k => k + opts.formParams![k]).join('');
  } else {
    base = opts.url + (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
  }
  const expected = hmac('sha1', opts.secret, base, 'base64');
  if (constTimeEqualStr(sig, expected)) return { ok: true };
  return { ok: false, reason: 'bad_signature', message: 'Signature mismatch' };
}
