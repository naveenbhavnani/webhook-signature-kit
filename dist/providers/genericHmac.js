// src/utils.ts
import { createHmac, timingSafeEqual } from "crypto";
function getHeader(headers, name) {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  const v = key ? headers[key] : void 0;
  if (Array.isArray(v)) return v[0];
  return v;
}
function toBuffer(data) {
  return Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
}
function hmac(algo, secret, data, enc = "hex") {
  return createHmac(algo, secret).update(toBuffer(data)).digest(enc);
}
function constTimeEqualStr(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// src/providers/genericHmac.ts
async function verifyGenericHmac(opts) {
  const { headers, rawBody } = opts.common;
  const cfg = opts.config;
  const headerVal = getHeader(headers, cfg.header);
  if (!headerVal) return { ok: false, reason: "missing_header", message: `${cfg.header} missing` };
  let provided = headerVal.trim();
  if (cfg.format.prefix && provided.startsWith(cfg.format.prefix)) provided = provided.slice(cfg.format.prefix.length);
  if (cfg.format.caseInsensitive) provided = provided.toLowerCase();
  const secrets = Array.isArray(cfg.secret) ? cfg.secret : [cfg.secret];
  const payload = buildPayload(cfg, "", rawBody);
  for (let i = 0; i < secrets.length; i++) {
    const expectedRaw = hmac(cfg.algo, secrets[i], payload, cfg.format.enc);
    const expected = cfg.format.caseInsensitive ? expectedRaw.toLowerCase() : expectedRaw;
    if (constTimeEqualStr(provided, expected)) return { ok: true, meta: { matchedIndex: i } };
  }
  return { ok: false, reason: "bad_signature", message: "Signature mismatch" };
}
function buildPayload(cfg, url, rawBody) {
  switch (cfg.payload) {
    case "raw-body":
      return rawBody;
    case "url+raw-body":
      return (url || "") + (typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"));
    case "raw-body+ts-header": {
      const ts = cfg.tsHeader ? "" : "";
      return typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    }
    default:
      return rawBody;
  }
}
export {
  verifyGenericHmac
};
