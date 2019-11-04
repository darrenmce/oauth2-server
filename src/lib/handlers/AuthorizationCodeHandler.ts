import Bluebird from 'bluebird';
import { AuthCodeValues, Stores } from '../stores/types';
import { Request, Response, Router } from 'express';
import { OAuthError } from './errors';
import { IRequestHandler } from '../../types/request-handler';
import { Authentication, AuthenticationActionRoutes } from './Authentication';
import { KeybaseUtil } from '../keybase';
import { OneTimeSignIn } from '../authentication/OneTimeSignIn';
import { asyncWrapHandler } from '../util/async-wrap-handler';

export const ONE_TIME_SIGN_IN_ERROR_REDIRECT_URI = '/error';

export class AuthorizationCodeHandler implements IRequestHandler {
  private readonly keybaseUtils: KeybaseUtil;

  constructor(
    private readonly stores: Stores,
    private readonly authentication: Authentication,
  ) {
    this.keybaseUtils = new KeybaseUtil();
  }

  public getRouter(): Router {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
      res.render('authorize', {
        ...req.query,
        action: req.baseUrl
      });
    });

    router.post('/', asyncWrapHandler(async (req: Request, res: Response) => {
      const { username } = req.body;

      const userExists = await this.stores.credentialsStore.exists(username);
      if (!userExists) {
        res.status(404).send('User not found');
      }

      const userMetaData = await this.stores.credentialsStore.getMetadata(username);

      let keybase_challenge = '';
      let challengeId = '';
      if (userMetaData.keybase_username) {
        const pubkey = await this.keybaseUtils.getKeybasePublicKey(userMetaData.keybase_username);
        const challenge = await this.stores.encryptionChallengeStore.generateChallenge(username, pubkey);
        keybase_challenge = challenge.encryptedMessage;
        challengeId = challenge.challengeId;
      }

      res.render('authorize_options', {
        ...req.body,
        action: `${req.baseUrl}/verify`,
        keybase_username: userMetaData.keybase_username,
        usernamePasswordMFAAuthType: AuthenticationActionRoutes.usernamePasswordMFA,
        keybaseProofAuthType: AuthenticationActionRoutes.keybaseProof,
        keybase_challenge,
        challengeId
      });
    }));

    router.get('/verify-one-time', asyncWrapHandler(async (req: Request, res: Response) => {
      const { username, token } = OneTimeSignIn.parseOneTimeURL(req.query);
      const validatePromise = this.authentication.verifyOneTimeSignIn(username, token);
      await this.handleAuthCodeRedirect(res, ONE_TIME_SIGN_IN_ERROR_REDIRECT_URI, validatePromise);
    }));

    router.post('/verify', asyncWrapHandler(async (req: Request, res: Response) => {
      const { authType } = req.body;

      const { username, client_id, redirect_uri, state } = req.body;

      const validatePromise = Bluebird.resolve(Authentication.validateVerifyRequest(authType, req.body))
        .then(() => this.authentication.verifyUser(authType, username, req.body))
        .then(() => ({
          username,
          clientId: client_id,
          redirectURI: redirect_uri,
          state
        }));

      await this.handleAuthCodeRedirect(res, redirect_uri, validatePromise);
    }));

    return router;
  }

  protected async handleAuthCodeRedirect(res: Response, baseRedirectURI: string, validation: Promise<AuthCodeValues>) {
    let authCodeValues: AuthCodeValues;
    try {
      authCodeValues = await validation;
      const authCode = await this.stores.authCodeStore.generate(authCodeValues);

      let fullRedirectURL = `${authCodeValues.redirectURI}?code=${authCode}`;
      if (authCodeValues.state) {
        fullRedirectURL += `&state=${authCodeValues.state}`;
      }
      res.redirect(302, fullRedirectURL);
    } catch (err) {
      if (err instanceof OAuthError) {
        res.redirect(302, `${baseRedirectURI}?${err.toQueryString((authCodeValues && authCodeValues.state))}`);
      } else {
        throw err;
      }
    }
  }
}
