import { describe, it, expect } from 'vitest';
import { getHeader, toBuffer, hmac, constTimeEqualStr, nowSeconds, ensure } from '../src/utils';

describe('Utility functions', () => {
  describe('getHeader', () => {
    it('finds header case-insensitively', () => {
      const headers = {
        'Content-Type': 'application/json',
        'x-hub-signature': 'sha1=abc123',
        'X-Custom-Header': 'value'
      };

      expect(getHeader(headers, 'content-type')).toBe('application/json');
      expect(getHeader(headers, 'X-Hub-Signature')).toBe('sha1=abc123');
      expect(getHeader(headers, 'x-custom-header')).toBe('value');
    });

    it('returns undefined for missing headers', () => {
      const headers = { 'Content-Type': 'application/json' };
      expect(getHeader(headers, 'Missing-Header')).toBeUndefined();
    });

    it('handles array values by returning first element', () => {
      const headers = {
        'Accept': ['application/json', 'text/html'],
        'Cookie': ['session=abc', 'csrf=def']
      };

      expect(getHeader(headers, 'accept')).toBe('application/json');
      expect(getHeader(headers, 'cookie')).toBe('session=abc');
    });

    it('handles undefined values', () => {
      const headers = { 'Test-Header': undefined };
      expect(getHeader(headers, 'test-header')).toBeUndefined();
    });
  });

  describe('toBuffer', () => {
    it('returns Buffer as-is', () => {
      const buf = Buffer.from('test data');
      expect(toBuffer(buf)).toBe(buf);
    });

    it('converts string to Buffer', () => {
      const str = 'test data';
      const result = toBuffer(str);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString('utf8')).toBe(str);
    });

    it('handles Unicode characters', () => {
      const str = 'Hello 世界 🌍';
      const result = toBuffer(str);
      expect(result.toString('utf8')).toBe(str);
    });

    it('handles empty string', () => {
      const result = toBuffer('');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('hmac', () => {
    const secret = 'test_secret';
    const data = 'test data';

    it('generates SHA-256 HMAC in hex', () => {
      const result = hmac('sha256', secret, data, 'hex');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates SHA-256 HMAC in base64', () => {
      const result = hmac('sha256', secret, data, 'base64');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('generates SHA-1 HMAC', () => {
      const result = hmac('sha1', secret, data, 'hex');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[a-f0-9]{40}$/);
    });

    it('generates SHA-512 HMAC', () => {
      const result = hmac('sha512', secret, data, 'hex');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[a-f0-9]{128}$/);
    });

    it('works with Buffer input', () => {
      const bufferData = Buffer.from(data, 'utf8');
      const result1 = hmac('sha256', secret, data, 'hex');
      const result2 = hmac('sha256', secret, bufferData, 'hex');
      expect(result1).toBe(result2);
    });

    it('defaults to hex encoding', () => {
      const result1 = hmac('sha256', secret, data);
      const result2 = hmac('sha256', secret, data, 'hex');
      expect(result1).toBe(result2);
    });
  });

  describe('constTimeEqualStr', () => {
    it('returns true for equal strings', () => {
      expect(constTimeEqualStr('hello', 'hello')).toBe(true);
      expect(constTimeEqualStr('', '')).toBe(true);
      expect(constTimeEqualStr('abc123', 'abc123')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(constTimeEqualStr('hello', 'world')).toBe(false);
      expect(constTimeEqualStr('abc123', 'def456')).toBe(false);
      expect(constTimeEqualStr('hello', 'Hello')).toBe(false);
    });

    it('returns false for different length strings', () => {
      expect(constTimeEqualStr('hello', 'hell')).toBe(false);
      expect(constTimeEqualStr('short', 'much longer string')).toBe(false);
      expect(constTimeEqualStr('', 'not empty')).toBe(false);
    });

    it('handles Unicode characters', () => {
      const str1 = 'Hello 世界 🌍';
      const str2 = 'Hello 世界 🌍';
      const str3 = 'Hello 世界 🌎';
      
      expect(constTimeEqualStr(str1, str2)).toBe(true);
      expect(constTimeEqualStr(str1, str3)).toBe(false);
    });

    it('is safe against timing attacks (basic check)', () => {
      // This is a basic check - real timing attack testing would require more sophisticated measurement
      const str1 = 'a'.repeat(1000);
      const str2 = 'b'.repeat(1000);
      const str3 = 'b'.repeat(999) + 'a'; // Different at the end
      
      expect(constTimeEqualStr(str1, str2)).toBe(false);
      expect(constTimeEqualStr(str1, str3)).toBe(false);
    });
  });

  describe('nowSeconds', () => {
    it('returns current Unix timestamp in seconds', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = nowSeconds();
      const after = Math.floor(Date.now() / 1000);
      
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('returns different values over time', async () => {
      const time1 = nowSeconds();
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait > 1 second
      const time2 = nowSeconds();
      
      expect(time2).toBeGreaterThan(time1);
    });
  });

  describe('ensure', () => {
    it('returns value if it exists and is not empty', () => {
      expect(ensure('hello', 'error')).toBe('hello');
      expect(ensure(123, 'error')).toBe(123);
      expect(ensure(true, 'error')).toBe(true);
      expect(ensure(false, 'error')).toBe(false);
      expect(ensure([], 'error')).toEqual([]);
      expect(ensure({}, 'error')).toEqual({});
    });

    it('throws for undefined values', () => {
      expect(() => ensure(undefined, 'Value is undefined')).toThrow('Value is undefined');
    });

    it('throws for null values', () => {
      expect(() => ensure(null, 'Value is null')).toThrow('Value is null');
    });

    it('throws for empty strings', () => {
      expect(() => ensure('', 'String is empty')).toThrow('String is empty');
    });

    it('allows zero as valid value', () => {
      expect(ensure(0, 'error')).toBe(0);
    });

    it('allows empty array as valid value', () => {
      expect(ensure([], 'error')).toEqual([]);
    });
  });
});