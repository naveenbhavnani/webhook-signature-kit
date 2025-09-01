import { G as GenericHmacConfig, V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.cjs';

declare function verifyGenericHmac(opts: {
    config: GenericHmacConfig;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyGenericHmac };
