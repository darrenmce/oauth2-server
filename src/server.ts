import express from 'express';
import bodyParser from 'body-parser';

import { createStores } from './lib/stores';
import { createGrants } from './lib/grants';

import { TokenHandler } from './lib/handlers/TokenHandler';
import { RegisterHandler } from './lib/handlers/RegisterHandler';
import { AuthorizationCodeHandler } from './lib/handlers/AuthorizationCodeHandler';
import { OAuthError } from './lib/handlers/errors';

import { OAuthConfig } from './config/types';
import { DBClients } from './lib/stores/types';
import { Authentication } from './lib/handlers/Authentication';
import { Services } from './services';
import { OneTimeSignIn } from './lib/authentication/OneTimeSignIn';

type CreateServerParams = {
  config: OAuthConfig,
  dbClients: DBClients,
  services: Services
}

export async function createServer({ config, dbClients, services }: CreateServerParams): Promise<express.Express> {
  const stores = createStores(config.stores, dbClients);
  const grants = createGrants(stores);

  const app = express();

  const authenticationLib = new Authentication(stores);

  const tokenRouter = new TokenHandler(grants, stores).getRouter();
  const registerRouter = new RegisterHandler(stores).getRouter();
  const authorizationCodeRouter = new AuthorizationCodeHandler(stores, authenticationLib).getRouter();
  const oneTimeSignInRouter = new OneTimeSignIn(stores, services.mailer).getRouter();

  app.set('view engine', 'pug');
  app.set('views', './views');

  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/login', (_req, res) => {
    res.render('login');
  });

  app.use('/one-time', oneTimeSignInRouter);
  app.use('/authorize', authorizationCodeRouter);
  app.use('/token', tokenRouter);
  app.use('/register', registerRouter);

  app.use((err, _req, res, next) => {
    if (err instanceof OAuthError && !res.headersSent) {
      return res.status(err.statusCode).send(`${err.message}${err.error_description ? ' - ' + err.error_description : ''}`);
    }
    next(err);
  });
  return app;
}

