import bodyParser from 'body-parser';
import Logger from 'bunyan';
import express from 'express';
import bunyanExpress from 'express-bunyan-logger';

import { createStores } from './lib/stores';
import { createGrants } from './lib/grants';

import { TokenHandler } from './lib/handlers/TokenHandler';
import { RegisterHandler } from './lib/handlers/RegisterHandler';
import { AuthorizationCodeHandler } from './lib/handlers/AuthorizationCodeHandler';
import { oAuthErrorHandler } from './lib/handlers/errors';

import { OAuthConfig } from './config/types';
import { DBClients } from './lib/stores/types';
import { Authentication } from './lib/handlers/Authentication';
import { Services } from './services';
import { OneTimeSignIn } from './lib/authentication/OneTimeSignIn';

type CreateServerParams = {
  log: Logger,
  config: OAuthConfig,
  dbClients: DBClients,
  services: Services
}

export async function createServer({ log, config, dbClients, services }: CreateServerParams): Promise<express.Express> {
  const stores = createStores(log, config.stores, dbClients);
  const grants = createGrants(log, stores);

  const app = express();

  const authenticationLib = new Authentication(stores);

  const tokenRouter = new TokenHandler(grants, stores).getRouter();
  const registerRouter = new RegisterHandler(config.auth.register, stores).getRouter();
  const authorizationCodeRouter = new AuthorizationCodeHandler(log, stores, authenticationLib).getRouter();
  const oneTimeSignInRouter = new OneTimeSignIn(stores, services.mailer).getRouter();

  app.set('view engine', 'pug');
  app.set('views', './views');

  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(bunyanExpress({
    logger: log
  }));

  app.get('/login', (_req, res) => {
    res.render('login');
  });

  app.use('/one-time', oneTimeSignInRouter);
  app.use('/authorize', authorizationCodeRouter);
  app.use('/token', tokenRouter);
  app.use('/register', registerRouter);

  app.use(oAuthErrorHandler);

  app.use(bunyanExpress.errorLogger({
    logger: log
  }));

  return app;
}

