import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

type Meta = {
    deliveryId?: string;
    algo: 'sha256' | 'sha1';
};
declare function verifyGitHub(opts: {
    secret: string;
    allowSha1?: boolean;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult<Meta>>;

export { verifyGitHub };
