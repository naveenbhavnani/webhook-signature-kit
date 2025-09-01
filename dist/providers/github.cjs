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

// src/providers/github.ts
var github_exports = {};
__export(github_exports, {
  verifyGitHub: () => verifyGitHub
});
module.exports = __toCommonJS(github_exports);

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

// src/providers/github.ts
async function verifyGitHub(opts) {
  const { headers, rawBody } = opts.common;
  const h256 = getHeader(headers, "X-Hub-Signature-256");
  const hSha1 = getHeader(headers, "X-Hub-Signature");
  const deliveryId = getHeader(headers, "X-GitHub-Delivery");
  if (!h256 && !(opts.allowSha1 && hSha1)) return { ok: false, reason: "missing_header", message: "Missing GitHub signature header" };
  const body = toBuffer(rawBody);
  if (h256) {
    const provided2 = h256.replace(/^sha256=/, "").trim();
    const expected2 = hmac("sha256", opts.secret, body, "hex");
    if (constTimeEqualStr(provided2, expected2)) return { ok: true, meta: { deliveryId, algo: "sha256" } };
    return { ok: false, reason: "bad_signature", message: "SHA-256 mismatch", meta: { deliveryId, algo: "sha256" } };
  }
  const provided = (hSha1 || "").replace(/^sha1=/, "").trim();
  const expected = hmac("sha1", opts.secret, body, "hex");
  if (constTimeEqualStr(provided, expected)) return { ok: true, meta: { deliveryId, algo: "sha1" } };
  return { ok: false, reason: "bad_signature", message: "SHA-1 mismatch", meta: { deliveryId, algo: "sha1" } };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifyGitHub
});
