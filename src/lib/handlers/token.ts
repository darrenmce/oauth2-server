import { NextFunction, Request, Response, Router } from 'express';

import { Grants, GrantType, Username } from '../grants/types';
import { Stores } from '../stores/types';
import { GrantNotAllowed } from '../stores/errors';
import { RouterConfig } from '../../config/types';

const DUMMY_SUCCESS_TOKEN = {
  'access_token': '2YotnFZFEjr1zCsicMWpAA',
  'token_type': 'example',
  'expires_in': 3600
};


type GrantValidationResult = {
  validated: boolean,
  reason?: string
}

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
      case GrantType.clientCredentials:
        return this.stores.keyStore.isEnabled(account).then(mfaEnabled => {
          if (mfaEnabled) {
            throw new GrantNotAllowed(`${GrantType.mfaPassword} OR ${GrantType.mfaClientCredentials}`);
          }
          return true;
        });
      default:
        return Promise.resolve(true);
    }
  }

  protected authorize(validation: Promise<Username>, grantType: GrantType): Promise<GrantValidationResult> {
    return validation
      .then(username => this.validateGrantType(grantType, username))
      .then(
        result => ({ validated: result }),
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
        case GrantType.clientCredentials:
          validation = this.grants.clientCredentials.validate(req.header('authorization'));
          break;
        case GrantType.password:
          validation = this.grants.password.validate({
            username: req.body.username,
            password: req.body.password
          });
          break;
        case GrantType.mfaClientCredentials:
          validation = this.grants.mfaClientCredentials.validate(req.header('authorization'), req.header(this.routerConfig.mfaTokenHeader));
        case GrantType.mfaPassword:
          validation = this.grants.mfaPassword.validate({
            username: req.body.username,
            password: req.body.password
          }, req.header(this.routerConfig.mfaTokenHeader))
      }

      const result = await this.authorize(validation, grantType);

      if (!result.validated) {
        return res.status(401).send(result.reason || 'Authorization Failed.');
      }

      res.json(DUMMY_SUCCESS_TOKEN);

    });

    return router;
  }

}
