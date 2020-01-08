import * as url from 'url';
import { URL } from 'url';
import { AuthCodeValues, Stores } from '../stores/types';
import { Request, Response, Router } from 'express';
import { IOAuthMailer } from '../mailer';
import { IRequestHandler } from '../../types/request-handler';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

enum ONE_TIME_SIGN_IN_QUERY_PARAM {
  TOKEN = 't',
  USERNAME = 'u'
}

type SignInData = {
  username: string,
  token: string
};

export class OneTimeSignIn implements IRequestHandler {
  public static parseOneTimeURL(query: Request['query']): SignInData {
    const {
      [ONE_TIME_SIGN_IN_QUERY_PARAM.TOKEN]: token,
      [ONE_TIME_SIGN_IN_QUERY_PARAM.USERNAME]: username,
    } = query;

    return {
      token,
      username,
    };
  }

  constructor(
    private readonly stores: Stores,
    private readonly mailer: IOAuthMailer
  ) {}

  protected async generateOneTimeURL(baseUrl: string, authCodeValues: AuthCodeValues): Promise<string> {
    const token = await this.stores.oneTimeSignInStore.create(authCodeValues);

    const oneTimeURL = new URL(baseUrl);

    oneTimeURL.searchParams.set(ONE_TIME_SIGN_IN_QUERY_PARAM.USERNAME, authCodeValues.username);
    oneTimeURL.searchParams.set(ONE_TIME_SIGN_IN_QUERY_PARAM.TOKEN, token);

    return oneTimeURL.toString();
  }

  public getRouter(): Router {
    const router = Router();

    router.post('/generate', async (req: Request, res: Response) => {
      const { username, client_id, redirect_uri, state } = req.body;

      if (!(await this.stores.credentialsStore.exists(username))) {
        throw new OAuthError(OAuthErrorType.accessDenied);
      }

      const baseUrl = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: '/authorize/verify-one-time',
      });

      // TODO: require client secret and can only be emailed on behalf of the user by the registered client
      const oneTimeURL = await this.generateOneTimeURL( baseUrl, {
        username,
        clientId: client_id,
        redirectURI: redirect_uri,
        state
      });

      await this.mailer.sendOneTimeSignIn(username, { url: oneTimeURL });
      if (!req.accepts('text/html')) {
        res.json({ status: 'OK' });
      } else {
        res.render('one_time_success', { email_address: username });
      }
    });

    return router;
  }
}
