import { Stores } from '../stores/types';
import { NextFunction, Request, Response, Router } from 'express';
import { BasicAuth } from '../grants/types';
import { AuthorizationFailedError } from '../stores/errors';

type AuthorizeRequest = {
  response_type: string,
  client_id: string,
  redirect_uri: string
  scope: string,
  state: string
}

export class AuthorizationCodeHandler {
  constructor(
    private readonly stores: Stores,
  ) {}


  async verifyUser(basicAuth: BasicAuth, mfaToken: string): Promise<void> {
    const basicVerified = await this.stores.credentialsStore.validate(basicAuth);

    if (!basicVerified) {
      throw new AuthorizationFailedError();
    }

    const mfaRequired = await this.stores.keyStore.isEnabled(basicAuth.username);
    if (mfaRequired && !(await this.stores.keyStore.verify(basicAuth.username, mfaToken))) {
      throw new AuthorizationFailedError();
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
      // TODO: implement `state`
      const { response_type, client_id, redirect_uri, state } = req.body;
      if (response_type !== 'code') {
        return res.status(400).send('response_type must be `code`');
      }
      const { username, password, mfa } = req.body;

      return this.verifyUser({ username, password }, mfa)
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
        .catch(next);

    });

    return router;
  }
}