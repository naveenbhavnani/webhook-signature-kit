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

// src/providers/gitlab.ts
async function verifyGitLab(opts) {
  const { headers } = opts.common;
  const token = getHeader(headers, "X-Gitlab-Token");
  if (!token) return { ok: false, reason: "missing_header", message: "X-Gitlab-Token missing" };
  if (constTimeEqualStr(token, opts.token)) return { ok: true };
  return { ok: false, reason: "bad_signature", message: "Token mismatch" };
}

// src/providers/genericHmac.ts
async function verifyGenericHmac(opts) {
  const { headers, rawBody } = opts.common;
  const cfg = opts.config;
  const headerVal = getHeader(headers, cfg.header);
  if (!headerVal) return { ok: false, reason: "missing_header", message: `${cfg.header} missing` };
  let provided = headerVal.trim();
  if (cfg.format.prefix && provided.startsWith(cfg.format.prefix)) provided = provided.slice(cfg.format.prefix.length);
  if (cfg.format.caseInsensitive) provided = provided.toLowerCase();
  const secrets = Array.isArray(cfg.secret) ? cfg.secret : [cfg.secret];
  const payload = buildPayload(cfg, "", rawBody);
  for (let i = 0; i < secrets.length; i++) {
    const expectedRaw = hmac(cfg.algo, secrets[i], payload, cfg.format.enc);
    const expected = cfg.format.caseInsensitive ? expectedRaw.toLowerCase() : expectedRaw;
    if (constTimeEqualStr(provided, expected)) return { ok: true, meta: { matchedIndex: i } };
  }
  return { ok: false, reason: "bad_signature", message: "Signature mismatch" };
}
function buildPayload(cfg, url, rawBody) {
  switch (cfg.payload) {
    case "raw-body":
      return rawBody;
    case "url+raw-body":
      return (url || "") + (typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"));
    case "raw-body+ts-header": {
      const ts = cfg.tsHeader ? "" : "";
      return typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    }
    default:
      return rawBody;
  }
}

// src/index.ts
async function verifyWebhook(opts) {
  switch (opts.provider) {
    case "stripe": {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError = null;
      for (let i = 0; i < secrets.length; i++) {
        const r = await verifyStripe({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching Stripe secret" };
    }
    case "slack": {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError = null;
      for (let i = 0; i < secrets.length; i++) {
        const r = await verifySlack({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching Slack secret" };
    }
    case "github": {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError = null;
      for (let i = 0; i < secrets.length; i++) {
        const r = await verifyGitHub({ secret: secrets[i], allowSha1: opts.allowSha1, common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching GitHub secret" };
    }
    case "razorpay": {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError = null;
      for (let i = 0; i < secrets.length; i++) {
        const r = await verifyRazorpay({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching Razorpay secret" };
    }
    case "shopify": {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError = null;
      for (let i = 0; i < secrets.length; i++) {
        const r = await verifyShopify({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching Shopify secret" };
    }
    case "twilio": {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError = null;
      for (let i = 0; i < secrets.length; i++) {
        const r = await verifyTwilio({ secret: secrets[i], url: opts.url, formParams: opts.formParams, common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching Twilio secret" };
    }
    case "gitlab": {
      const tokens = Array.isArray(opts.token) ? opts.token : [opts.token];
      let lastError = null;
      for (let i = 0; i < tokens.length; i++) {
        const r = await verifyGitLab({ token: tokens[i], common: opts });
        if (r.ok) return r;
        if (!lastError || r.reason !== "bad_signature" && lastError.reason === "bad_signature") {
          lastError = r;
        }
      }
      return lastError || { ok: false, reason: "bad_signature", message: "No matching GitLab token" };
    }
    case "generic-hmac": {
      return verifyGenericHmac({ config: opts.config, common: opts });
    }
    default:
      return { ok: false, reason: "unsupported_provider", message: "Unsupported provider" };
  }
}

// src/adapters/aws.ts
async function awsLambdaVerify(event, opts) {
  const headers = event.headers || {};
  const isB64 = !!event.isBase64Encoded;
  const rawBody = Buffer.from(event.body ?? "", isB64 ? "base64" : "utf8");
  return verifyWebhook({ ...opts, headers, rawBody });
}
export {
  awsLambdaVerify
};
