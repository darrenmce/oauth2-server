import * as express from 'express';
import * as bodyParser from 'body-parser';

import { createStores } from './lib/stores';
import { createGrants } from './lib/grants';

import { TokenHandler } from './lib/handlers/TokenHandler';
import { RegisterHandler } from './lib/handlers/RegisterHandler';
import { AuthorizationCodeHandler } from './lib/handlers/AuthorizationCodeHandler';
import { OAuthError } from './lib/handlers/errors';

import { OAuthConfig } from './config/types';
import { DBClients } from './lib/stores/types';

type CreateServerParams = {
  config: OAuthConfig,
  dbClients: DBClients
}

export function createServer({ config, dbClients }: CreateServerParams): express.Express {
  const stores = createStores(config.stores, dbClients);
  const grants = createGrants(stores);

  const app = express();

  const tokenRouter = new TokenHandler(grants, stores).getRouter();
  const registerRouter = new RegisterHandler(stores).getRouter();
  const authorizationCodeRouter = new AuthorizationCodeHandler(stores).getRouter();

  app.set('view engine', 'pug');
  app.set('views', './views');

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use('/authorize', authorizationCodeRouter);
  app.use('/token', tokenRouter);
  app.use('/register', registerRouter);

  app.get('/login', (req, res) => {
    res.render('login');
  });

  app.use((err, req, res, next) => {
    if (err instanceof OAuthError && !res.headersSent) {
      return res.status(err.statusCode).send(`${err.message}${err.error_description ? ' - ' + err.error_description : ''}`);
    }
    next(err);
  });
  return app;
}

