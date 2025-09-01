"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/providers/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  verifyStripe: () => verifyStripe
});
module.exports = __toCommonJS(stripe_exports);

// src/utils.ts
var import_crypto = require("crypto");
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
  return (0, import_crypto.createHmac)(algo, secret).update(toBuffer(data)).digest(enc);
}
function constTimeEqualStr(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return (0, import_crypto.timingSafeEqual)(ab, bb);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifyStripe
});
