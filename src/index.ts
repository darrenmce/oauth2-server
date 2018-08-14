import * as express from 'express';
import * as bodyParser from 'body-parser';

import { keyStoreFactory } from './lib/stores/key-store-factory';
import { credentialsStoreFactory } from './lib/stores/credentials-store-factory';
import { ClientCredentials } from './lib/grants/ClientCredentials';
import { Password } from './lib/grants/Password';
import { MFAClientCredentials } from './lib/grants/MFAClientCredentials';
import { MFAPassword } from './lib/grants/MFAPassword';

import { getConfig } from './config';
import { TokenHandler } from './lib/handlers/token';

import { Grants } from './lib/grants/types';
import { CredentialsStoreType, KeyStoreType, Stores } from './lib/stores/types';
import { RegisterHandler } from './lib/handlers/register';

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
const credsStore = credentialsStoreFactory(CredentialsStoreType.memory, {
  test: '123',
  testMfa: 'abc'
});

const clientCredentials = new ClientCredentials(credsStore);
const passwordGrant = new Password(credsStore);
const grants: Grants = {
  clientCredentials,
  password: passwordGrant,
  mfaClientCredentials: new MFAClientCredentials(clientCredentials, keyStore),
  mfaPassword: new MFAPassword(passwordGrant, keyStore)
};

const stores: Stores = {
  keyStore,

  credentialsStore: credsStore
};
const tokenRouter = new TokenHandler(
  config.router,
  grants,
  stores
).getRouter();
const registerRouter = new RegisterHandler(stores).getRouter();

const app = express();
app.set('view engine', 'pug');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/auth', tokenRouter);
app.use('/register', registerRouter);

app.get('/login', (req, res) => {
  res.render('login');
});

app.listen(8080, () => {
  console.log('listening on 8080');
});