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

// src/providers/shopify.ts
var shopify_exports = {};
__export(shopify_exports, {
  verifyShopify: () => verifyShopify
});
module.exports = __toCommonJS(shopify_exports);

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

// src/providers/shopify.ts
async function verifyShopify(opts) {
  const { headers, rawBody } = opts.common;
  const hdr = getHeader(headers, "X-Shopify-Hmac-Sha256");
  if (!hdr) return { ok: false, reason: "missing_header", message: "X-Shopify-Hmac-Sha256 missing" };
  const expected = hmac("sha256", opts.secret, toBuffer(rawBody), "base64");
  const provided = hdr.trim();
  if (constTimeEqualStr(provided, expected)) return { ok: true };
  return { ok: false, reason: "bad_signature", message: "Signature mismatch" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifyShopify
});
