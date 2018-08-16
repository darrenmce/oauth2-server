import { AuthCode, AuthCodeConsume, IAuthorizationCodeStore, ICredentialsStore } from '../stores/types';
import { BasicAuth, GrantValidatedResponse } from './types';

export class AuthorizationCode {
  constructor(
    private readonly codeStore: IAuthorizationCodeStore,
    private readonly credentialsStore: ICredentialsStore
  ) {}

  async validate(clientAuth: BasicAuth, authCode: AuthCode, authCodeParams: AuthCodeConsume): Promise<GrantValidatedResponse> {
    const clientAuthenticated = await this.credentialsStore.validate(clientAuth);
    if (!clientAuthenticated) {
      return {
        validated: false,
        reason: 'Client not authenticated'
      };
    }

    const result = await this.codeStore.consume(authCode, authCodeParams);

    if (!result) {
      return {
        validated: false,
        reason: 'Invalid authentication code'
      };
    }

    if (result.clientId !== clientAuth.username) {
      return {
        validated: false,
        reason: 'Client mismatch'
      };
    }

    return {
      validated: true,
      user: {
        username: result.username,
        fullname: result.username //TODO: fix this
      }
    }

  }

}