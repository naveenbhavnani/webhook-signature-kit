import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

type Meta = {
    t: number;
    matchedV1?: string;
};
declare function verifyStripe(opts: {
    secret: string;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult<Meta>>;

export { verifyStripe };
