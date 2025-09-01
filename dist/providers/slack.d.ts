import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

type Meta = {
    ts: number;
};
declare function verifySlack(opts: {
    secret: string;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult<Meta>>;

export { verifySlack };
