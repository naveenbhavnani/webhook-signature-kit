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

// src/providers/twilio.ts
async function verifyTwilio(opts) {
  const { headers, rawBody } = opts.common;
  const sig = getHeader(headers, "X-Twilio-Signature");
  if (!sig) return { ok: false, reason: "missing_header", message: "X-Twilio-Signature missing" };
  let base;
  if (opts.formParams && Object.keys(opts.formParams).length > 0) {
    const sortedKeys = Object.keys(opts.formParams).sort();
    base = opts.url + sortedKeys.map((k) => k + opts.formParams[k]).join("");
  } else {
    base = opts.url + (typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"));
  }
  const expected = hmac("sha1", opts.secret, base, "base64");
  if (constTimeEqualStr(sig, expected)) return { ok: true };
  return { ok: false, reason: "bad_signature", message: "Signature mismatch" };
}
export {
  verifyTwilio
};
