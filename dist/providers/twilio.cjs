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

// src/providers/twilio.ts
var twilio_exports = {};
__export(twilio_exports, {
  verifyTwilio: () => verifyTwilio
});
module.exports = __toCommonJS(twilio_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifyTwilio
});
