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

// src/providers/slack.ts
async function verifySlack(opts) {
  const { headers, rawBody, tolerance = 300, replayStore } = opts.common;
  const sig = getHeader(headers, "X-Slack-Signature");
  const tsStr = getHeader(headers, "X-Slack-Request-Timestamp");
  if (!sig || !tsStr) return { ok: false, reason: "missing_header", message: "Slack headers missing" };
  if (!sig.startsWith("v0=")) return { ok: false, reason: "bad_header", message: "Slack signature must start with v0=" };
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_header", message: "Invalid Slack timestamp" };
  if (Math.abs(nowSeconds() - ts) > tolerance) return { ok: false, reason: "timestamp_out_of_tolerance", message: "Timestamp out of tolerance", meta: { ts } };
  const base = `v0:${ts}:${toBuffer(rawBody).toString("utf8")}`;
  const expected = hmac("sha256", opts.secret, base, "hex");
  const provided = sig.slice(3);
  if (!constTimeEqualStr(provided, expected)) return { ok: false, reason: "bad_signature", message: "Signature mismatch", meta: { ts } };
  if (replayStore) {
    const key = `slack:${ts}:${expected}`;
    const fresh = await replayStore.putOnce(key, tolerance);
    if (!fresh) return { ok: false, reason: "replay_detected", message: "Duplicate delivery detected", meta: { ts } };
  }
  return { ok: true, meta: { ts } };
}
export {
  verifySlack
};
