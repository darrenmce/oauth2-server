import { ICredentialsStore } from '../stores/types';
import { IGrant, PasswordValidate, User } from './types';
import { OAuthError, OAuthErrorType } from '../handlers/errors';
import Logger from 'bunyan';

export class Password implements IGrant<PasswordValidate> {
  constructor(
    private readonly log: Logger,
    private readonly credentialsStore: ICredentialsStore
  ) {}

  async validate(passwordValidate: PasswordValidate): Promise<User> {
    if (!passwordValidate.username || !passwordValidate.password) {
      this.log.warn({ passwordValidate }, 'Password grant failed - missing data');
      throw new OAuthError(OAuthErrorType.invalidRequest);
    }

    const validated = await this.credentialsStore.validate(passwordValidate);

    if (!validated) {
      this.log.warn({ passwordValidate }, 'Password grant failed - could not validate credentials');
      throw new OAuthError(OAuthErrorType.accessDenied);
    }

    return {
      username: passwordValidate.username,
      fullname: passwordValidate.username
    }
  }
}
