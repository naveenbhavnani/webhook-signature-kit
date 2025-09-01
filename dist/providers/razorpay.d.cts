import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.cjs';

declare function verifyRazorpay(opts: {
    secret: string;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyRazorpay };
