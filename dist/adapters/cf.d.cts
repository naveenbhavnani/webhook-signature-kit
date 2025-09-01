import { V as VerifyWebhookOptions, a as VerifyResult } from './types-BSqyom2b.cjs';

declare function cfVerify(request: Request, opts: Omit<VerifyWebhookOptions, 'headers' | 'rawBody'>): Promise<VerifyResult<any>>;

export { cfVerify };
