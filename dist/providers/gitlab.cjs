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

// src/providers/gitlab.ts
var gitlab_exports = {};
__export(gitlab_exports, {
  verifyGitLab: () => verifyGitLab
});
module.exports = __toCommonJS(gitlab_exports);

// src/utils.ts
var import_crypto = require("crypto");
function getHeader(headers, name) {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  const v = key ? headers[key] : void 0;
  if (Array.isArray(v)) return v[0];
  return v;
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

// src/providers/gitlab.ts
async function verifyGitLab(opts) {
  const { headers } = opts.common;
  const token = getHeader(headers, "X-Gitlab-Token");
  if (!token) return { ok: false, reason: "missing_header", message: "X-Gitlab-Token missing" };
  if (constTimeEqualStr(token, opts.token)) return { ok: true };
  return { ok: false, reason: "bad_signature", message: "Token mismatch" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifyGitLab
});
