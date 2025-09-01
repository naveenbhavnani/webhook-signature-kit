import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

declare function verifyShopify(opts: {
    secret: string;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyShopify };
