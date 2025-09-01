export declare function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined;
export declare function toBuffer(data: Buffer | string): Buffer;
export declare function hmac(algo: 'sha1' | 'sha256' | 'sha512', secret: string, data: Buffer | string, enc?: 'hex' | 'base64'): string;
export declare function constTimeEqualStr(a: string, b: string): boolean;
export declare function nowSeconds(): number;
export declare function ensure<T>(val: T | undefined | null, reason: string): T;
