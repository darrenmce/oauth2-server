import Bluebird from 'bluebird';
import rp from 'request-promise';
import { EncryptionProof, Stores } from '../stores/types';
import { NextFunction, Request, Response, Router } from 'express';
import { BasicAuth, Username } from '../grants/types';
import { OAuthError, OAuthErrorType } from './errors';
import { IRequestHandler } from '../../types/request-handler';

enum AuthorizationActionRoutes {
  usernamePasswordMFA = 'usernamePasswordMFA',
  keybaseProof = 'keybaseProof'
}

export class AuthorizationCodeHandler implements IRequestHandler {

  protected static validateRequest(authType: AuthorizationActionRoutes, body: any): void {
    // TODO: implement `state`
    const { response_type } = body;
    if (response_type !== 'code') {
      throw new OAuthError(OAuthErrorType.unsupportedResponseType);
    }

    switch (authType) {
      case AuthorizationActionRoutes.usernamePasswordMFA:
        if (!body.password) {
          throw new OAuthError(OAuthErrorType.invalidRequest);
        }
        break;
      case AuthorizationActionRoutes.keybaseProof:
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

  protected verifyUser(authType: AuthorizationActionRoutes, username: Username, body: any): Promise<void> {
    switch (authType) {
      case AuthorizationActionRoutes.usernamePasswordMFA:
        return this.verifyBasicAuth({ username, password: body.password }, body.mfa);
      case AuthorizationActionRoutes.keybaseProof:
        return this.verifyEncryptionProof({
          username,
          challengeId: body.challengeId,
          decodedMessage: body.decodedMessage
        });
      default:
        throw new OAuthError(OAuthErrorType.invalidRequest);
    }
  }

  public getRouter(): Router {
    const router = Router();


    router.get('/', (req: Request, res: Response) => {
      res.render('authorize', {
        ...req.query,
        action: req.baseUrl
      });
    });

    router.post('/', async (req: Request, res: Response) => {
      const { username } = req.body;

      const userExists = await this.stores.credentialsStore.exists(username);
      if (!userExists) {
        res.status(404).send('User not found');
      }

      const userMetaData = await this.stores.credentialsStore.getMetadata(username);

      let keybase_challenge = '';
      let challengeId = '';
      if (userMetaData.keybase_username) {
        const pubkey = await rp(`https://keybase.io/${userMetaData.keybase_username}/pgp_keys.asc`);
        const challenge = await this.stores.encryptionChallengeStore.generateChallenge(username, pubkey);
        keybase_challenge = challenge.encryptedMessage;
        challengeId = challenge.challengeId;
      }

      res.render('authorize_options', {
        ...req.body,
        action: `${req.baseUrl}/verify`,
        keybase_username: userMetaData.keybase_username,
        usernamePasswordMFAAuthType: AuthorizationActionRoutes.usernamePasswordMFA,
        keybaseProofAuthType: AuthorizationActionRoutes.keybaseProof,
        keybase_challenge,
        challengeId
      });
    });

    router.post('/verify', (req: Request, res: Response, next: NextFunction) => {

      const { authType } = req.body;

      const { username, client_id, redirect_uri, state } = req.body;

      return Bluebird.resolve()
        .then(() => AuthorizationCodeHandler.validateRequest(authType, req.body))
        .then(() => this.verifyUser(authType, username, req.body))
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
