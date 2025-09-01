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
function nowSeconds() {
  return Math.floor(Date.now() / 1e3);
}

// src/providers/stripe.ts
async function verifyStripe(opts) {
  const { headers, rawBody, tolerance = 300, replayStore } = opts.common;
  const sigHeader = getHeader(headers, "Stripe-Signature");
  if (!sigHeader) return { ok: false, reason: "missing_header", message: "Stripe-Signature missing" };
  const parts = sigHeader.split(",").map((s) => s.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts.filter((p) => p.startsWith("v1="));
  if (!tPart || v1Parts.length === 0) return { ok: false, reason: "bad_header", message: "Malformed Stripe-Signature" };
  const t = Number(tPart.slice(2));
  if (!Number.isFinite(t)) return { ok: false, reason: "bad_header", message: "Invalid timestamp" };
  if (Math.abs(nowSeconds() - t) > tolerance) return { ok: false, reason: "timestamp_out_of_tolerance", message: "Timestamp out of tolerance", meta: { t } };
  const payload = `${t}.${toBuffer(rawBody).toString("utf8")}`;
  const expected = hmac("sha256", opts.secret, payload, "hex");
  for (const v1 of v1Parts) {
    const sig = v1.slice(3);
    if (constTimeEqualStr(sig, expected)) {
      if (replayStore) {
        const key = `stripe:${t}:${expected.slice(0, 16)}`;
        const fresh = await replayStore.putOnce(key, tolerance);
        if (!fresh) return { ok: false, reason: "replay_detected", message: "Duplicate delivery detected", meta: { t, matchedV1: sig } };
      }
      return { ok: true, meta: { t, matchedV1: sig } };
    }
  }
  return { ok: false, reason: "bad_signature", message: "No v1 signature matched", meta: { t } };
}
export {
  verifyStripe
};
