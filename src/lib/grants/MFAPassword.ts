import { IKeyStore } from '../stores/types';
import { IGrant, MFAPasswordValidate, User } from './types';
import { Password } from './Password';
import { OAuthError, OAuthErrorType } from '../handlers/errors';
import Logger from 'bunyan';

export class MFAPassword implements IGrant<MFAPasswordValidate> {
  constructor(
    private readonly log: Logger,
    private readonly passwordGrant: Password,
    private readonly keyStore: IKeyStore
  ) {}

  async validate({ passwordValidate, mfaToken}: MFAPasswordValidate): Promise<User> {
      if (!passwordValidate.username || !passwordValidate.password || !mfaToken) {
        this.log.warn({ passwordValidate, mfaToken }, 'MFAPassword grant failed - missing data');
        throw new OAuthError(OAuthErrorType.invalidRequest);
      }
      const user = await this.passwordGrant.validate(passwordValidate);
      const verifiedMFA = await this.keyStore.verify(passwordValidate.username, mfaToken);

      if (!verifiedMFA) {
        this.log.warn({ passwordValidate, mfaToken }, 'MFAPassword grant failed - mfa token invalid');
        throw new OAuthError(OAuthErrorType.accessDenied)
      }

      return user;
  }
}
