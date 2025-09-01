import { VerifyOptionsCommon, VerifyResult } from '../types';
import { getHeader, hmac, constTimeEqualStr, nowSeconds, toBuffer } from '../utils';

type Meta = { ts: number };

export async function verifySlack(opts: { secret: string, common: VerifyOptionsCommon }): Promise<VerifyResult<Meta>> {
  const { headers, rawBody, tolerance = 300, replayStore } = opts.common;
  const sig = getHeader(headers, 'X-Slack-Signature');
  const tsStr = getHeader(headers, 'X-Slack-Request-Timestamp');
  if (!sig || !tsStr) return { ok: false, reason: 'missing_header', message: 'Slack headers missing' };
  if (!sig.startsWith('v0=')) return { ok: false, reason: 'bad_header', message: 'Slack signature must start with v0=' };
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_header', message: 'Invalid Slack timestamp' };
  if (Math.abs(nowSeconds() - ts) > tolerance) return { ok: false, reason: 'timestamp_out_of_tolerance', message: 'Timestamp out of tolerance', meta: { ts } };
  const base = `v0:${ts}:${toBuffer(rawBody).toString('utf8')}`;
  const expected = hmac('sha256', opts.secret, base, 'hex');
  const provided = sig.slice(3);
  if (!constTimeEqualStr(provided, expected)) return { ok: false, reason: 'bad_signature', message: 'Signature mismatch', meta: { ts } };
  if (replayStore) {
    const key = `slack:${ts}:${expected}`;
    const fresh = await replayStore.putOnce(key, tolerance);
    if (!fresh) return { ok: false, reason: 'replay_detected', message: 'Duplicate delivery detected', meta: { ts } };
  }
  return { ok: true, meta: { ts } };
}
