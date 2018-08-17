import * as Bluebird from 'bluebird';
import { NextFunction, Request, Response, Router } from 'express';
import * as basicAuthLib from 'basic-auth';
import { Grants, User, SupportedGrantType, UnsupportedGrantType, Username, IGrant } from '../grants/types';
import { Stores } from '../stores/types';
import { RouterConfig } from '../../config/types';
import { OAuthError, OAuthErrorType } from './errors';

type GrantRequestParams = {
  body: any,
  authHeader: string,
  tokenHeader: string
}

export class TokenHandler {
  constructor(
    private readonly routerConfig: RouterConfig,
    private readonly grants: Grants,
    private readonly stores: Stores
  ) {}

  protected validateGrantType(requestedGrantType: string): void {
    if (!(<any>Object).values(SupportedGrantType).includes(requestedGrantType)) {
      if (!(<any>Object).values(UnsupportedGrantType).includes(requestedGrantType)) {
        throw new OAuthError(OAuthErrorType.invalidGrant);
      }
      throw new OAuthError(OAuthErrorType.unsupportedGrantType);
    }
  }

  protected validateUserGrantType(grantType: SupportedGrantType, username: Username): Promise<void> {
    if (!username) {
      return Promise.reject(new OAuthError(OAuthErrorType.invalidRequest));
    }
    switch (grantType) {
      case SupportedGrantType.password:
        return this.stores.keyStore.isEnabled(username).then(mfaEnabled => {
          if (mfaEnabled) {
            throw new OAuthError(OAuthErrorType.invalidGrant, `use ${SupportedGrantType.mfaPassword} instead`);
          }
        });
    }
  }

  protected authorize(grantType: SupportedGrantType, { body, authHeader, tokenHeader }: GrantRequestParams): Promise<User> {

    switch(grantType) {
      case SupportedGrantType.password:
        return this.grants.password.validate({
          username: body.username,
          password: body.password
        });
      case SupportedGrantType.mfaPassword:
        return this.grants.mfaPassword.validate({
          passwordValidate: {
            username: body.username,
            password: body.password
          },
          mfaToken: tokenHeader
        });
      case SupportedGrantType.authorizationCode:
        const auth = basicAuthLib.parse(authHeader);
        return this.grants.authorizationCode.validate({
          clientAuth: {
            username: auth.name,
            password: auth.pass
          },
          authCode: body.code,
          authCodeParams: {
            redirectURI: body.redirect_uri
          }
        });
    }
  }


  getRouter(): Router {
    const router = Router();

    router.post('/token', (req: Request, res: Response, next: NextFunction) => {
      const grantType = req.body.grant_type;

      Bluebird.resolve()
        .then(() => this.validateGrantType(grantType))
        .then(() => this.authorize(grantType, {
          body: req.body,
          tokenHeader: req.header(this.routerConfig.mfaTokenHeader),
          authHeader: req.header('authorization')
        }))
        .tap(user => this.validateUserGrantType(grantType, user.username))
        .then(user => {
          res.json({
            'access_token': '2YotnFZFEjr1zCsicMWpAA',
            'token_type': 'example',
            'expires_in': 3600,
            user
          });
        })
        .catch(next);
    });

    return router;
  }

}