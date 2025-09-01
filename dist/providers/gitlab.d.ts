import { V as VerifyOptionsCommon, a as VerifyResult } from './types-CgyOx_vD.js';

declare function verifyGitLab(opts: {
    token: string;
    common: VerifyOptionsCommon;
}): Promise<VerifyResult>;

export { verifyGitLab };
