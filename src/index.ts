import type { VerifyWebhookOptions, VerifyResult } from './types';
import { verifyStripe } from './providers/stripe';
import { verifySlack } from './providers/slack';
import { verifyGitHub } from './providers/github';
import { verifyRazorpay } from './providers/razorpay';
import { verifyShopify } from './providers/shopify';
import { verifyTwilio } from './providers/twilio';
import { verifyGitLab } from './providers/gitlab';
import { verifyGenericHmac } from './providers/genericHmac';

export async function verifyWebhook(opts: VerifyWebhookOptions): Promise<VerifyResult> {
  switch (opts.provider) {
    case 'stripe': {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<secrets.length;i++) {
        const r = await verifyStripe({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching Stripe secret' };
    }
    case 'slack': {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<secrets.length;i++) {
        const r = await verifySlack({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching Slack secret' };
    }
    case 'github': {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<secrets.length;i++) {
        const r = await verifyGitHub({ secret: secrets[i], allowSha1: opts.allowSha1, common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching GitHub secret' };
    }
    case 'razorpay': {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<secrets.length;i++) {
        const r = await verifyRazorpay({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching Razorpay secret' };
    }
    case 'shopify': {
      const secrets = Array.isArray(opts.secret) ? opts.secret : [opts.secret];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<secrets.length;i++) {
        const r = await verifyShopify({ secret: secrets[i], common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching Shopify secret' };
    }
    case 'twilio': {
      const secrets = Array.isArray((opts as any).secret) ? (opts as any).secret : [(opts as any).secret];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<secrets.length;i++) {
        const r = await verifyTwilio({ secret: secrets[i], url: (opts as any).url, formParams: (opts as any).formParams, common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching Twilio secret' };
    }
    case 'gitlab': {
      const tokens = Array.isArray((opts as any).token) ? (opts as any).token : [(opts as any).token];
      let lastError: VerifyResult | null = null;
      for (let i=0;i<tokens.length;i++) {
        const r = await verifyGitLab({ token: tokens[i], common: opts });
        if (r.ok) return r;
        if (!lastError || (r.reason !== 'bad_signature' && lastError.reason === 'bad_signature')) {
          lastError = r;
        }
      }
      return lastError || { ok:false, reason:'bad_signature', message:'No matching GitLab token' };
    }
    case 'generic-hmac': {
      return verifyGenericHmac({ config: (opts as any).config, common: opts });
    }
    default:
      return { ok:false, reason:'unsupported_provider', message:'Unsupported provider' };
  }
}

// Re-exports
export * from './types';
