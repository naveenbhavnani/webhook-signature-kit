// src/utils.ts
import { createHmac, timingSafeEqual } from "crypto";
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
    return timingSafeEqual(ab, bb);
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
export {
  verifyGitLab
};
