import { V as VerifyWebhookOptions, a as VerifyResult } from './types-BSqyom2b.cjs';
import { IncomingMessage, ServerResponse } from 'http';

declare function nextVerify(req: IncomingMessage, res: ServerResponse, opts: Omit<VerifyWebhookOptions, 'headers' | 'rawBody'>): Promise<VerifyResult<any>>;

export { nextVerify };
