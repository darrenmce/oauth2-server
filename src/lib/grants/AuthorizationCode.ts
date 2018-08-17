import { IAuthorizationCodeStore, ICredentialsStore } from '../stores/types';
import { AuthorizationCodeValidate, IGrant, User } from './types';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

export class AuthorizationCode implements IGrant<AuthorizationCodeValidate> {
  constructor(
    private readonly codeStore: IAuthorizationCodeStore,
    private readonly credentialsStore: ICredentialsStore
  ) {}

  async validate({ clientAuth, authCode, authCodeParams }: AuthorizationCodeValidate): Promise<User> {
    const clientAuthenticated = await this.credentialsStore.validate(clientAuth);
    if (!clientAuthenticated) {
      throw new OAuthError(OAuthErrorType.accessDenied)
    }

    const result = await this.codeStore.consume(authCode, authCodeParams);

    if (!result) {
      throw new OAuthError(OAuthErrorType.invalidRequest)
    }

    if (result.clientId !== clientAuth.username) {
      throw new OAuthError(OAuthErrorType.unauthorizedClient)
    }

    return {
      username: result.username,
      fullname: result.username //TODO: fix these (all the grants)
    }

  }

}