import { VerifyOptionsCommon, VerifyResult } from '../types';
import { getHeader, constTimeEqualStr } from '../utils';

export async function verifyGitLab(opts: { token: string, common: VerifyOptionsCommon }): Promise<VerifyResult> {
  const { headers } = opts.common;
  const token = getHeader(headers, 'X-Gitlab-Token');
  if (!token) return { ok: false, reason: 'missing_header', message: 'X-Gitlab-Token missing' };
  if (constTimeEqualStr(token, opts.token)) return { ok: true };
  return { ok: false, reason: 'bad_signature', message: 'Token mismatch' };
}
