import { VerifyResult, VerifyOptionsCommon } from '../types';
import { getHeader, hmac, constTimeEqualStr, nowSeconds, toBuffer } from '../utils';

type Meta = { t: number; matchedV1?: string };

export async function verifyStripe(opts: { secret: string, common: VerifyOptionsCommon }): Promise<VerifyResult<Meta>> {
  const { headers, rawBody, tolerance = 300, replayStore } = opts.common;
  const sigHeader = getHeader(headers, 'Stripe-Signature');
  if (!sigHeader) return { ok: false, reason: 'missing_header', message: 'Stripe-Signature missing' };
  const parts = sigHeader.split(',').map(s => s.trim());
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Parts = parts.filter(p => p.startsWith('v1='));
  if (!tPart || v1Parts.length === 0) return { ok: false, reason: 'bad_header', message: 'Malformed Stripe-Signature' };
  const t = Number(tPart.slice(2));
  if (!Number.isFinite(t)) return { ok: false, reason: 'bad_header', message: 'Invalid timestamp' };
  if (Math.abs(nowSeconds() - t) > tolerance) return { ok: false, reason: 'timestamp_out_of_tolerance', message: 'Timestamp out of tolerance', meta: { t } };

  const payload = `${t}.${toBuffer(rawBody).toString('utf8')}`;
  const expected = hmac('sha256', opts.secret, payload, 'hex');
  for (const v1 of v1Parts) {
    const sig = v1.slice(3);
    if (constTimeEqualStr(sig, expected)) {
      // Optional replay protection
      if (replayStore) {
        const key = `stripe:${t}:${expected.slice(0,16)}`;
        const fresh = await replayStore.putOnce(key, tolerance);
        if (!fresh) return { ok: false, reason: 'replay_detected', message: 'Duplicate delivery detected', meta: { t, matchedV1: sig } };
      }
      return { ok: true, meta: { t, matchedV1: sig } };
    }
  }
  return { ok: false, reason: 'bad_signature', message: 'No v1 signature matched', meta: { t } };
}
