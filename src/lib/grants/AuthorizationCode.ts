import { IAuthorizationCodeStore, ICredentialsStore } from '../stores/types';
import { AuthorizationCodeValidate, IGrant, User } from './types';
import { OAuthError, OAuthErrorType } from '../handlers/errors';
import Logger from 'bunyan';

export class AuthorizationCode implements IGrant<AuthorizationCodeValidate> {
  constructor(
    private readonly log: Logger,
    private readonly codeStore: IAuthorizationCodeStore,
    private readonly credentialsStore: ICredentialsStore
  ) {}

  async validate({ clientAuth, authCode, authCodeParams }: AuthorizationCodeValidate): Promise<User> {
    const clientAuthenticated = await this.credentialsStore.validate(clientAuth);
    if (!clientAuthenticated) {
      this.log.warn({ clientAuth }, 'AuthorizationCode grant failed due to client credentials');
      throw new OAuthError(OAuthErrorType.accessDenied)
    }

    const result = await this.codeStore.consume(authCode, authCodeParams);

    if (!result) {
      this.log.warn({ authCode, authCodeParams, clientAuth }, 'AuthorizationCode grant failed due invalid or unknown code');
      throw new OAuthError(OAuthErrorType.invalidRequest)
    }

    // TODO: Think on this...
    //  Perhaps this belongs in the codeStore consume, and we dont consume the code in this case
    if (result.clientId !== clientAuth.username) {
      this.log.warn({ result, clientAuth }, 'AuthorizationCode grant failed due to unauthorized client');
      throw new OAuthError(OAuthErrorType.unauthorizedClient)
    }

    return {
      username: result.username,
      fullname: result.username //TODO: fix these (all the grants)
    }
  }
}
