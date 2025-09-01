import { GenericHmacConfig, VerifyOptionsCommon, VerifyResult } from '../types';
import { getHeader, hmac, constTimeEqualStr } from '../utils';

export async function verifyGenericHmac(opts: { config: GenericHmacConfig, common: VerifyOptionsCommon }): Promise<VerifyResult> {
  const { headers, rawBody } = opts.common;
  const cfg = opts.config;
  const headerVal = getHeader(headers, cfg.header);
  if (!headerVal) return { ok: false, reason: 'missing_header', message: `${cfg.header} missing` };
  let provided = headerVal.trim();
  if (cfg.format.prefix && provided.startsWith(cfg.format.prefix)) provided = provided.slice(cfg.format.prefix.length);
  if (cfg.format.caseInsensitive) provided = provided.toLowerCase();

  const secrets = Array.isArray(cfg.secret) ? cfg.secret : [cfg.secret];
  const payload = buildPayload(cfg, '', rawBody);
  for (let i=0;i<secrets.length;i++) {
    const expectedRaw = hmac(cfg.algo, secrets[i], payload, cfg.format.enc);
    const expected = cfg.format.caseInsensitive ? expectedRaw.toLowerCase() : expectedRaw;
    if (constTimeEqualStr(provided, expected)) return { ok: true, meta: { matchedIndex: i } };
  }
  return { ok: false, reason: 'bad_signature', message: 'Signature mismatch' };
}

function buildPayload(cfg: GenericHmacConfig, url: string, rawBody: Buffer|string): Buffer|string {
  switch (cfg.payload) {
    case 'raw-body': return rawBody;
    case 'url+raw-body': return (url || '') + (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
    case 'raw-body+ts-header': {
      const ts = cfg.tsHeader ? '' : ''; // extend for tsHeader payloads if needed
      return (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
    }
    default: return rawBody;
  }
}
