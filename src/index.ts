import * as express from 'express';
import * as bodyParser from 'body-parser';

import { keyStoreFactory } from './lib/stores/key-store-factory';
import { credentialsStoreFactory } from './lib/stores/credentials-store-factory';
import { Password } from './lib/grants/Password';
import { MFAPassword } from './lib/grants/MFAPassword';

import { getConfig } from './config';
import { TokenHandler } from './lib/handlers/TokenHandler';

import { Grants } from './lib/grants/types';
import { AuthCodeStoreType, CredentialsStoreType, KeyStoreType, Stores } from './lib/stores/types';
import { RegisterHandler } from './lib/handlers/RegisterHandler';
import { authCodeStoreFactory } from './lib/stores/auth-code-store-factory';
import { AuthorizationCode } from './lib/grants/AuthorizationCode';
import { AuthorizationCodeHandler } from './lib/handlers/AuthorizationCodeHandler';
import { OAuthError } from './lib/handlers/errors';

//extend the request type
declare global {
  namespace Express {
    interface Request {
      auth?: any
    }
  }
}

const config = getConfig();

const keyStore = keyStoreFactory(KeyStoreType.memory, {
  testMfa: '766s v7ay wjyi 26nf 3uk2 gyyn pzvz suvl'
});
const credentialsStore = credentialsStoreFactory(CredentialsStoreType.memory, {
  test: '123',
  testMfa: 'abc'
});
const authCodeStore = authCodeStoreFactory(AuthCodeStoreType.memory);


const stores: Stores = {
  keyStore,
  credentialsStore,
  authCodeStore
};

stores.authCodeStore.generate({clientId: 'test', username: 'testMfa', redirectURI: 'http://google.ca'});

const passwordGrant = new Password(stores.credentialsStore);
const grants: Grants = {
  password: passwordGrant,
  mfaPassword: new MFAPassword(passwordGrant, keyStore),
  authorizationCode: new AuthorizationCode(stores.authCodeStore, stores.credentialsStore)
};


const tokenRouter = new TokenHandler(
  config.router,
  grants,
  stores
).getRouter();
const registerRouter = new RegisterHandler(stores).getRouter();
const authorizationCodeRouter = new AuthorizationCodeHandler(stores).getRouter();
const app = express();
app.set('view engine', 'pug');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/authorize', authorizationCodeRouter);
app.use('/auth', tokenRouter);
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

app.listen(8080, () => {
  console.log('listening on 8080');
});