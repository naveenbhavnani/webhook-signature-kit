import { createHmac, timingSafeEqual } from 'crypto';

export function getHeader(headers: Record<string, string|string[]|undefined>, name: string): string | undefined {
  const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  const v = key ? headers[key] : undefined;
  if (Array.isArray(v)) return v[0];
  return v as string | undefined;
}

export function toBuffer(data: Buffer | string): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
}

export function hmac(algo: 'sha1'|'sha256'|'sha512', secret: string, data: Buffer | string, enc: 'hex'|'base64' = 'hex'): string {
  return createHmac(algo, secret).update(toBuffer(data)).digest(enc);
}

export function constTimeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return false; }
}

export function nowSeconds(): number { return Math.floor(Date.now()/1000); }

export function ensure<T>(val: T | undefined | null, reason: string): T {
  if (val === undefined || val === null || (typeof val === 'string' && val.length === 0)) {
    throw new Error(reason);
  }
  return val;
}
