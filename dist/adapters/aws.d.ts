import { V as VerifyWebhookOptions, a as VerifyResult } from './types-BSqyom2b.js';

declare function awsLambdaVerify(event: any, opts: Omit<VerifyWebhookOptions, 'headers' | 'rawBody'>): Promise<VerifyResult<any>>;

export { awsLambdaVerify };
