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

// src/providers/razorpay.ts
async function verifyRazorpay(opts) {
  const { headers, rawBody } = opts.common;
  const hdr = getHeader(headers, "X-Razorpay-Signature");
  if (!hdr) return { ok: false, reason: "missing_header", message: "X-Razorpay-Signature missing" };
  const expected = hmac("sha256", opts.secret, toBuffer(rawBody), "base64");
  const provided = hdr.trim();
  if (constTimeEqualStr(provided, expected)) return { ok: true };
  return { ok: false, reason: "bad_signature", message: "Signature mismatch" };
}
export {
  verifyRazorpay
};
