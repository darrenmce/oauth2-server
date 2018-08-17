import { ICredentialsStore } from '../stores/types';
import { IGrant, PasswordValidate, User } from './types';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

export class Password implements IGrant<PasswordValidate> {
  constructor(
    private readonly credentialsStore: ICredentialsStore
  ) {}

  validate(basicAuth: PasswordValidate): Promise<User> {
    return Promise.resolve()
      .then(() => {
        if (!basicAuth.username || !basicAuth.password) {
          throw new OAuthError(OAuthErrorType.invalidRequest);
        }
      })
      .then(() => this.credentialsStore.validate(basicAuth))
      .then(validated => {
        if (!validated) {
          throw new OAuthError(OAuthErrorType.accessDenied);
        }
        return {
          username: basicAuth.username,
          fullname: basicAuth.username
        }
      });
  }
}