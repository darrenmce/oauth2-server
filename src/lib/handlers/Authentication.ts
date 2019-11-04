import { OAuthError, OAuthErrorType } from './errors';
import { BasicAuth, Username } from '../grants/types';
import { AuthCodeValues, EncryptionProof, Stores } from '../stores/types';
import { Request } from 'express';

export enum AuthenticationActionRoutes {
  usernamePasswordMFA = 'usernamePasswordMFA',
  keybaseProof = 'keybaseProof'
}

export class Authentication {
  public static validateVerifyRequest(authType: AuthenticationActionRoutes, body: Request['body']): void {
    // TODO: implement `state`
    const { response_type } = body;
    if (response_type !== 'code') {
      throw new OAuthError(OAuthErrorType.unsupportedResponseType);
    }

    switch (authType) {
      case AuthenticationActionRoutes.usernamePasswordMFA:
        if (!body.password) {
          throw new OAuthError(OAuthErrorType.invalidRequest);
        }
        break;
      case AuthenticationActionRoutes.keybaseProof:
        if (!body.decodedMessage) {
          throw new OAuthError(OAuthErrorType.invalidRequest);
        }
        break;
      default:
        throw new OAuthError(OAuthErrorType.invalidRequest);
    }
  }

  constructor(
    private readonly stores: Stores,
  ) {}

  protected async verifyBasicAuth(basicAuth: BasicAuth, mfaToken: string): Promise<void> {
    if (!basicAuth.username || !basicAuth.password) {
      throw new OAuthError(OAuthErrorType.invalidRequest);
    }

    const basicVerified = await this.stores.credentialsStore.validate(basicAuth);

    if (!basicVerified) {
      throw new OAuthError(OAuthErrorType.accessDenied, 'Authorization Failed');
    }

    const mfaRequired = await this.stores.keyStore.isEnabled(basicAuth.username);
    if (mfaRequired && !(await this.stores.keyStore.verify(basicAuth.username, mfaToken))) {
      throw new OAuthError(OAuthErrorType.accessDenied, 'Authorization Failed');
    }
  }

  protected async verifyEncryptionProof(proof: EncryptionProof): Promise<void> {
    if (!proof.username) {
      throw new OAuthError(OAuthErrorType.invalidRequest);
    }

    const verified = await this.stores.encryptionChallengeStore.validateAndConsumeProof(proof);

    if (!verified) {
      throw new OAuthError(OAuthErrorType.accessDenied, 'Authorization Failed');
    }
  }

  public async verifyOneTimeSignIn(username: Username, token: string): Promise<AuthCodeValues> {
    if (!username) {
      throw new OAuthError(OAuthErrorType.invalidRequest);
    }
    const authCodeValues = await this.stores.oneTimeSignInStore.consume(token);
    if (!authCodeValues || authCodeValues.username !== username) {
      throw new OAuthError(OAuthErrorType.accessDenied, 'Authorization Failed');
    }
    return authCodeValues;
  }

  public async verifyUser(authType: AuthenticationActionRoutes, username: Username, body: Request['body']): Promise<void> {
    switch (authType) {
      case AuthenticationActionRoutes.usernamePasswordMFA:
        return this.verifyBasicAuth({ username, password: body.password }, body.mfa);
      case AuthenticationActionRoutes.keybaseProof:
        return this.verifyEncryptionProof({
          username,
          challengeId: body.challengeId,
          decodedMessage: body.decodedMessage
        });
      default:
        throw new OAuthError(OAuthErrorType.invalidRequest);
    }
  }
}
