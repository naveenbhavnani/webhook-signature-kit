import { V as VerifyWebhookOptions, a as VerifyResult } from './types-BSqyom2b.cjs';

declare function awsLambdaVerify(event: any, opts: Omit<VerifyWebhookOptions, 'headers' | 'rawBody'>): Promise<VerifyResult<any>>;

export { awsLambdaVerify };
