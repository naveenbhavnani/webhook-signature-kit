import { G as GenericHmacConfig, V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

declare function verifyGenericHmac(opts: {
    config: GenericHmacConfig;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyGenericHmac };
