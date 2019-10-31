import { Request, Response, Router } from 'express';
import basicAuthLib from 'basic-auth';
import {
  AuthorizationCodeValidate,
  Grants,
  GrantType,
  IGrant,
  MFAPasswordValidate,
  PasswordValidate,
  UNSUPPORTED_GRANT,
  User,
  Username
} from '../grants/types';
import { Stores } from '../stores/types';
import { OAuthError, OAuthErrorType } from './errors';
import { IRequestHandler } from '../../types/request-handler';
import {
  GrantRequestBody,
  validateAuthorizationCodeGrantRequestBody,
  validateMFAGrantRequestBody,
  validatePasswordGrantRequestBody
} from '../grants/validate';

type GrantRequestParams = {
  body: GrantRequestBody,
  authHeader: string,
}

export class TokenHandler implements IRequestHandler {
  constructor(
    private readonly grants: Grants,
    private readonly stores: Stores
  ) {}

  protected validateGrantType(requestedGrantType: string): void {
    if (!this.grants[requestedGrantType]) {
      throw new OAuthError(OAuthErrorType.invalidGrant);
    }
    if (this.grants[requestedGrantType] === UNSUPPORTED_GRANT) {
      throw new OAuthError(OAuthErrorType.unsupportedGrantType);
    }
  }

  protected async validateUserGrantType(grantType: GrantType, username: Username): Promise<void> {
    if (!username) {
      return Promise.reject(new OAuthError(OAuthErrorType.invalidRequest));
    }
    switch (grantType) {
      case GrantType.password: {
        const mfaEnabled = await this.stores.keyStore.isEnabled(username);
        if (mfaEnabled) {
          throw new OAuthError(OAuthErrorType.invalidGrant, `use ${GrantType.mfaPassword} instead`);
        }
      }
    }
  }

  protected async authorize(grantType: GrantType, { body, authHeader }: GrantRequestParams): Promise<User> {
    switch(grantType) {
      case GrantType.password: {
        const validatedBody = await validatePasswordGrantRequestBody(body);
        return (this.grants[GrantType.password] as IGrant<PasswordValidate>).validate({
          username: validatedBody.username,
          password: validatedBody.password
        });
      }
      case GrantType.mfaPassword: {
        const validatedBody = await validateMFAGrantRequestBody(body);
        return (this.grants[GrantType.mfaPassword] as IGrant<MFAPasswordValidate>).validate({
          passwordValidate: {
            username: validatedBody.username,
            password: validatedBody.password
          },
          mfaToken: validatedBody.mfa_token
        });
      }
      case GrantType.authorizationCode: {
        const auth = basicAuthLib.parse(authHeader);
        const validatedBody = await validateAuthorizationCodeGrantRequestBody(body);
        return (this.grants[GrantType.authorizationCode] as IGrant<AuthorizationCodeValidate>).validate({
          clientAuth: {
            username: auth.name,
            password: auth.pass
          },
          authCode: validatedBody.code,
          authCodeParams: {
            redirectURI: validatedBody.redirect_uri
          }
        });
      }
      case GrantType.clientCredentials: {
        throw new OAuthError(OAuthErrorType.invalidGrant, 'not yet implemented');
      }
    }
  }

  protected async tokenHandler(req: Request, res: Response) {
    const grantType = req.body.grant_type;

    await this.validateGrantType(grantType);

    const user = await this.authorize(grantType, {
      body: req.body,
      authHeader: req.header('authorization')
    });

    await this.validateUserGrantType(grantType, user.username);

    res.json({
      'access_token': '2YotnFZFEjr1zCsicMWpAA',
      'token_type': 'example',
      'expires_in': 3600,
      user
    });
  }

  public getRouter(): Router {
    const router = Router();

    router.post('/', this.tokenHandler.bind(this));

    return router;
  }

}
