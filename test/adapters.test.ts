import { describe, it, expect, vi } from 'vitest';
import { expressMiddleware } from '../src/adapters/express';
import { nextVerify } from '../src/adapters/next';
import { awsLambdaVerify } from '../src/adapters/aws';
import { cfVerify } from '../src/adapters/cf';
import { createHmac } from 'crypto';

describe('Framework adapters', () => {
  describe('Express middleware', () => {
    it('creates middleware that verifies webhooks', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
      
      const middleware = expressMiddleware({
        provider: 'github',
        secret
      });

      const mockReq = {
        rawBody: Buffer.from(rawBody),
        headers: {
          'x-hub-signature-256': `sha256=${sig}`
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      } as any;

      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalledWith('ok');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 for invalid signature', async () => {
      const middleware = expressMiddleware({
        provider: 'github',
        secret: 'test_secret'
      });

      const mockReq = {
        rawBody: Buffer.from('{"test": "data"}'),
        headers: {
          'x-hub-signature-256': 'sha256=invalid_signature'
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      } as any;

      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        reason: 'bad_signature'
      }));
    });

    it('returns 400 when rawBody is missing', async () => {
      const middleware = expressMiddleware({
        provider: 'github',
        secret: 'test_secret'
      });

      const mockReq = {
        headers: {
          'x-hub-signature-256': 'sha256=something'
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      } as any;

      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        reason: 'body_unavailable'
      }));
    });

    it('calls onVerified callback on successful verification', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
      const onVerified = vi.fn();

      const middleware = expressMiddleware({
        provider: 'github',
        secret,
        onVerified
      });

      const mockReq = {
        rawBody: Buffer.from(rawBody),
        headers: {
          'x-hub-signature-256': `sha256=${sig}`
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      } as any;

      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(onVerified).toHaveBeenCalledWith({
        req: mockReq,
        rawBody: mockReq.rawBody,
        headers: mockReq.headers
      });
    });

    it('works with GitLab token verification', async () => {
      const token = 'gitlab_token';
      
      const middleware = expressMiddleware({
        provider: 'gitlab',
        token
      });

      const mockReq = {
        rawBody: Buffer.from('{"test": "data"}'),
        headers: {
          'x-gitlab-token': token
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      } as any;

      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalledWith('ok');
    });
  });

  describe('Next.js adapter', () => {
    it('verifies webhook in Next.js environment', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');

      // Mock a readable stream for Next.js request
      const mockReq = {
        headers: {
          'x-hub-signature-256': `sha256=${sig}`
        },
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(rawBody));
          } else if (event === 'end') {
            callback();
          }
        })
      } as any;

      const mockRes = {} as any;

      const result = await nextVerify(mockReq, mockRes, {
        provider: 'github',
        secret
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('AWS Lambda adapter', () => {
    it('verifies webhook in AWS Lambda environment', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');

      const mockEvent = {
        headers: {
          'x-hub-signature-256': `sha256=${sig}`
        },
        body: rawBody,
        isBase64Encoded: false
      };

      const result = await awsLambdaVerify(mockEvent, {
        provider: 'github',
        secret
      });

      expect(result.ok).toBe(true);
    });

    it('handles base64 encoded body', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const base64Body = Buffer.from(rawBody).toString('base64');
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');

      const mockEvent = {
        headers: {
          'x-hub-signature-256': `sha256=${sig}`
        },
        body: base64Body,
        isBase64Encoded: true
      };

      const result = await awsLambdaVerify(mockEvent, {
        provider: 'github',
        secret
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('Cloudflare Workers adapter', () => {
    it('verifies webhook in Cloudflare Workers environment', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');

      const mockRequest = {
        text: vi.fn().mockResolvedValue(rawBody),
        headers: new Map([
          ['x-hub-signature-256', `sha256=${sig}`]
        ])
      } as any;

      const result = await cfVerify(mockRequest, {
        provider: 'github',
        secret
      });

      expect(result.ok).toBe(true);
      expect(mockRequest.text).toHaveBeenCalled();
    });

    it('handles Request with standard Headers object', async () => {
      const secret = 'test_secret';
      const rawBody = '{"test": "data"}';
      const sig = createHmac('sha256', secret).update(rawBody).digest('hex');

      // Create a proper Headers object like in browser/CF Workers
      const headers = new Headers();
      headers.set('x-hub-signature-256', `sha256=${sig}`);

      const mockRequest = {
        text: vi.fn().mockResolvedValue(rawBody),
        headers
      } as any;

      const result = await cfVerify(mockRequest, {
        provider: 'github',
        secret
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('handles exceptions gracefully in Express middleware', async () => {
      const middleware = expressMiddleware({
        provider: 'github',
        secret: 'test_secret'
      });

      // Mock request that will cause an error  
      const mockReq = {
        rawBody: Buffer.from('test'),
        headers: {
          'x-hub-signature-256': 'sha256=invalid_signature_that_will_fail'
        }
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
      } as any;

      const mockNext = vi.fn();

      await middleware(mockReq, mockRes, mockNext);

      // This will return 401 because of bad signature, not 500
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        reason: 'bad_signature'
      }));
    });
  });
});