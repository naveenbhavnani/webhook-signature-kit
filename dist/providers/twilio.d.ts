import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

declare function verifyTwilio(opts: {
    secret: string;
    url: string;
    formParams?: Record<string, string>;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyTwilio };
