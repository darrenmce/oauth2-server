import * as Bluebird from 'bluebird';
import { NextFunction, Request, Response, Router } from 'express';
import * as basicAuthLib from 'basic-auth';
import { Grants, GrantType, GrantValidatedResponse, Username } from '../grants/types';
import { Stores } from '../stores/types';
import { GrantNotAllowedError } from '../stores/errors';
import { RouterConfig } from '../../config/types';

export class TokenHandler {
  constructor(
    private readonly routerConfig: RouterConfig,
    private readonly grants: Grants,
    private readonly stores: Stores
  ) {}

  protected validateGrantType(grantType: GrantType, account: string): Promise<boolean> {
    if (!account) {
      return Promise.resolve(false);
    }
    switch (grantType) {
      case GrantType.password:
        return this.stores.keyStore.isEnabled(account).then(mfaEnabled => {
          if (mfaEnabled) {
            throw new GrantNotAllowedError(GrantType.mfaPassword);
          }
          return true;
        });
      default:
        return Promise.resolve(true);
    }
  }

  protected authorize(validation: Promise<Username>, grantType: GrantType): Promise<GrantValidatedResponse> {
    return Bluebird.resolve(validation)
      .tap(
        validationResult => this.validateGrantType(grantType, validationResult.user.username),
      err => ({ validated: false, reason: err.message })
      );
  }

  getRouter(): Router {
    const router = Router();

    router.post('/token', async (req: Request, res: Response, next: NextFunction) => {
      const grantType: GrantType = req.body.grant_type;
      if (!(<any>Object).values(GrantType).includes(grantType)) {
        res.status(400).send(`Unknown/Invalid grant type - ${grantType}`);
      }

      let validation;
      switch(grantType) {
        case GrantType.password:
          validation = this.grants.password.validate({
            username: req.body.username,
            password: req.body.password
          });
          break;
        case GrantType.mfaPassword:
          validation = this.grants.mfaPassword.validate({
            username: req.body.username,
            password: req.body.password
          }, req.header(this.routerConfig.mfaTokenHeader));
          break;
        case GrantType.authorizationCode:
          const authHeader = basicAuthLib.parse(req.header('Authorization'));
          validation = this.grants.authorizationCode.validate(
            {
              username: authHeader.name,
              password: authHeader.pass
            },
            req.body.code,
            {
              redirectURI: req.body.redirect_uri
            }
          );
      }

      const result = await this.authorize(validation, grantType);

      if (!result.validated) {
        return res.status(401).send(result.reason || 'Authorization Failed.');
      }

      res.json({
        'access_token': '2YotnFZFEjr1zCsicMWpAA',
        'token_type': 'example',
        'expires_in': 3600,
        user: result.user
      });

    });

    return router;
  }

}
