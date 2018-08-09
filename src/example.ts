import * as fs from 'fs';
import * as express from 'express';
import { MFAExpress } from './index';
import { keyStoreFactory, KeyStoreType } from './lib/key-store-factory';

//extend the request type
declare global {
  namespace Express {
    interface Request {
      auth?: any
    }
  }
}

const app = express();
const keyStore = keyStoreFactory(KeyStoreType.memory);

let config = {
  issuer: "my test issuer",
  keyStore,
  tokenHeader: 'X-Token',
  jwtKeys: {
    pub: fs.readFileSync(__dirname + '/test_keys/public.key'),
    priv: fs.readFileSync(__dirname + '/test_keys/private.key')
  }
};

const mfa = new MFAExpress(
  config.jwtKeys,
  config.issuer,
  config.tokenHeader,
  config.keyStore
);

app.get('/register', mfa.register);
app.get('/login', mfa.login);
app.use(mfa.validate);

app.get('/test', (req, res) => {
  res.json(req.auth);
});

app.listen(8080, () => {
  console.log('listening on 8080');
});