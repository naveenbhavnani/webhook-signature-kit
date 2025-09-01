import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fastifyPlugin } from '../src/adapters/fastify';
import { createHmac } from 'crypto';
describe('Fastify adapter', () => {
    let mockInstance;
    beforeEach(() => {
        mockInstance = {
            addHook: vi.fn()
        };
    });
    it('registers preHandler hook correctly', async () => {
        await fastifyPlugin(mockInstance, {
            provider: 'github',
            secret: 'test_secret'
        });
        expect(mockInstance.addHook).toHaveBeenCalledWith('preHandler', expect.any(Function));
    });
    it('verifies webhook and sends success response', async () => {
        const secret = 'test_secret';
        const rawBody = '{"test": "data"}';
        const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
        await fastifyPlugin(mockInstance, {
            provider: 'github',
            secret
        });
        const hookHandler = mockInstance.addHook.mock.calls[0][1];
        const mockRequest = {
            rawBody: Buffer.from(rawBody),
            headers: {
                'x-hub-signature-256': `sha256=${sig}`
            }
        };
        const mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        await hookHandler(mockRequest, mockReply);
        expect(mockReply.status).toHaveBeenCalledWith(200);
        expect(mockReply.send).toHaveBeenCalledWith('ok');
    });
    it('sends 401 for invalid signature', async () => {
        await fastifyPlugin(mockInstance, {
            provider: 'github',
            secret: 'test_secret'
        });
        const hookHandler = mockInstance.addHook.mock.calls[0][1];
        const mockRequest = {
            rawBody: Buffer.from('{"test": "data"}'),
            headers: {
                'x-hub-signature-256': 'sha256=invalid_signature'
            }
        };
        const mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        await hookHandler(mockRequest, mockReply);
        expect(mockReply.status).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
            ok: false,
            reason: 'bad_signature'
        }));
    });
    it('sends 400 when rawBody is missing', async () => {
        await fastifyPlugin(mockInstance, {
            provider: 'github',
            secret: 'test_secret'
        });
        const hookHandler = mockInstance.addHook.mock.calls[0][1];
        const mockRequest = {
            headers: {
                'x-hub-signature-256': 'sha256=something'
            }
        };
        const mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        await hookHandler(mockRequest, mockReply);
        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
            ok: false,
            reason: 'body_unavailable'
        }));
    });
    it('calls onVerified callback on successful verification', async () => {
        const secret = 'test_secret';
        const rawBody = '{"test": "data"}';
        const sig = createHmac('sha256', secret).update(rawBody).digest('hex');
        const onVerified = vi.fn();
        await fastifyPlugin(mockInstance, {
            provider: 'github',
            secret,
            onVerified
        });
        const hookHandler = mockInstance.addHook.mock.calls[0][1];
        const mockRequest = {
            rawBody: Buffer.from(rawBody),
            headers: {
                'x-hub-signature-256': `sha256=${sig}`
            }
        };
        const mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        await hookHandler(mockRequest, mockReply);
        expect(onVerified).toHaveBeenCalledWith({
            req: mockRequest,
            rawBody: mockRequest.rawBody,
            headers: mockRequest.headers
        });
    });
    it('works with GitLab token verification', async () => {
        const token = 'gitlab_token';
        await fastifyPlugin(mockInstance, {
            provider: 'gitlab',
            token
        });
        const hookHandler = mockInstance.addHook.mock.calls[0][1];
        const mockRequest = {
            rawBody: Buffer.from('{"test": "data"}'),
            headers: {
                'x-gitlab-token': token
            }
        };
        const mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        await hookHandler(mockRequest, mockReply);
        expect(mockReply.status).toHaveBeenCalledWith(200);
        expect(mockReply.send).toHaveBeenCalledWith('ok');
    });
    it('handles exceptions and sends 500 error', async () => {
        await fastifyPlugin(mockInstance, {
            provider: 'github',
            secret: 'test_secret'
        });
        const hookHandler = mockInstance.addHook.mock.calls[0][1];
        // Mock request that would cause an internal error
        const mockRequest = {
            get rawBody() {
                throw new Error('Test error');
            },
            headers: {}
        };
        const mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        await hookHandler(mockRequest, mockReply);
        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
            ok: false,
            reason: 'unsupported_provider'
        }));
    });
});
