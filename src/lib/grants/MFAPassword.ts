import { IKeyStore } from '../stores/types';
import { IGrant, MFAPasswordValidate, User } from './types';
import { Password } from './Password';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

export class MFAPassword implements IGrant<MFAPasswordValidate> {
  constructor(
    private readonly passwordGrant: Password,
    private readonly keyStore: IKeyStore
  ) {}

  async validate({ passwordValidate, mfaToken}: MFAPasswordValidate): Promise<User> {
      if (!passwordValidate.username || !passwordValidate.username || !mfaToken) {
        throw new OAuthError(OAuthErrorType.invalidRequest);
      }
      const user = await this.passwordGrant.validate(passwordValidate);

      const verifiedMFA = await this.keyStore.verify(passwordValidate.username, mfaToken);

      if (!verifiedMFA) {
        throw new OAuthError(OAuthErrorType.accessDenied)
      }

      return user;
  }
}