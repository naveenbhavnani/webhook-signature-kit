import { createHmac, timingSafeEqual } from 'crypto';
export function getHeader(headers, name) {
    const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
    const v = key ? headers[key] : undefined;
    if (Array.isArray(v))
        return v[0];
    return v;
}
export function toBuffer(data) {
    return Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
}
export function hmac(algo, secret, data, enc = 'hex') {
    return createHmac(algo, secret).update(toBuffer(data)).digest(enc);
}
export function constTimeEqualStr(a, b) {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length)
        return false;
    try {
        return timingSafeEqual(ab, bb);
    }
    catch {
        return false;
    }
}
export function nowSeconds() { return Math.floor(Date.now() / 1000); }
export function ensure(val, reason) {
    if (val === undefined || val === null || (typeof val === 'string' && val.length === 0)) {
        throw new Error(reason);
    }
    return val;
}
