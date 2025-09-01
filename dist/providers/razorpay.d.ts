import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

declare function verifyRazorpay(opts: {
    secret: string;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyRazorpay };
