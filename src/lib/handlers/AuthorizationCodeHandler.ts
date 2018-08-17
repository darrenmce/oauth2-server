import * as Bluebird from 'bluebird';
import { Stores } from '../stores/types';
import { NextFunction, Request, Response, Router } from 'express';
import { BasicAuth } from '../grants/types';
import { OAuthError, OAuthErrorType } from './errors';

export class AuthorizationCodeHandler {

  static validateRequest(body: any): void {
    // TODO: implement `state`
    const { response_type } = body;
    if (response_type !== 'code') {
      throw new OAuthError(OAuthErrorType.unsupportedResponseType);
    }
  }

  constructor(
    private readonly stores: Stores,
  ) {}

  async verifyUser(basicAuth: BasicAuth, mfaToken: string): Promise<void> {
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

  getRouter(): Router {
    const router = Router();

    router.get('/', (req: Request, res: Response, next: NextFunction) => {
      res.render('authorize', {
        ...req.query,
        action: req.baseUrl
      });
    });

    router.post('/', (req: Request, res: Response, next: NextFunction) => {

      const { username, password, mfa, client_id, redirect_uri, state } = req.body;

      return Bluebird.resolve()
        .then(() => AuthorizationCodeHandler.validateRequest(req.body))
        .then(() => this.verifyUser({ username, password }, mfa))
        .then(() => this.stores.authCodeStore.generate({
          username,
          clientId: client_id,
          redirectURI: redirect_uri
        }))
        .then(authCode => {
          let redirectURL = `${redirect_uri}?code=${authCode}`;
          if (state) {
            redirectURL += `&state=${state}`;
          }
          res.redirect(302, redirectURL);
        })
        .catch(OAuthError, (err: OAuthError) => {
          res.redirect(302, `${redirect_uri}?${err.toQueryString(state)}`);
        })
        .catch(next);

    });

    return router;
  }
}