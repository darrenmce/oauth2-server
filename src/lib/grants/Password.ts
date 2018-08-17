import { ICredentialsStore } from '../stores/types';
import { IGrant, PasswordValidate, User } from './types';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

export class Password implements IGrant<PasswordValidate> {
  constructor(
    private readonly credentialsStore: ICredentialsStore
  ) {}

  async validate(basicAuth: PasswordValidate): Promise<User> {
    if (!basicAuth.username || !basicAuth.password) {
      throw new OAuthError(OAuthErrorType.invalidRequest);
    }

    const validated = await this.credentialsStore.validate(basicAuth);

    if (!validated) {
      throw new OAuthError(OAuthErrorType.accessDenied);
    }

    return {
      username: basicAuth.username,
      fullname: basicAuth.username
    }
  }
}