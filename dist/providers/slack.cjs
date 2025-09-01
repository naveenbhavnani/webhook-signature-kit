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

// src/providers/slack.ts
var slack_exports = {};
__export(slack_exports, {
  verifySlack: () => verifySlack
});
module.exports = __toCommonJS(slack_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifySlack
});
