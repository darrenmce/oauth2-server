import * as Bluebird from 'bluebird';
import { IKeyStore } from '../stores/types';
import { IGrant, MFAPasswordValidate, User } from './types';
import { Password } from './Password';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

export class MFAPassword implements IGrant<MFAPasswordValidate> {
  constructor(
    private readonly passwordGrant: Password,
    private readonly keyStore: IKeyStore
  ) {}

  validate({ passwordValidate, mfaToken}: MFAPasswordValidate): Promise<User> {
    return Bluebird.resolve()
      .then(() => {
        if (!passwordValidate.username || !passwordValidate.username || !mfaToken) {
          throw new OAuthError(OAuthErrorType.invalidRequest);
        }
      })
      .then(() => this.passwordGrant.validate(passwordValidate))
      .tap(() =>
        this.keyStore.verify(passwordValidate.username, mfaToken)
          .then(verified => {
            if (!verified) {
              throw new OAuthError(OAuthErrorType.accessDenied)
            }
          })
      )
  }
}