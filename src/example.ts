import * as fs from 'fs';
import * as express from 'express';
import { createMFAHandlers } from './index';
import { keyStoreFactory, KeyStoreType } from './lib/key-store-factory';

const app = express();

const keyStore = keyStoreFactory(KeyStoreType.memory);

const mfaHandlers = createMFAHandlers({
  issuer: "my test issuer",
  keyStore,
  tokenHeader: 'X-Token',
  jwtKeys: {
    pub: fs.readFileSync(__dirname + '/test_keys/public.key'),
    priv: fs.readFileSync(__dirname + '/test_keys/private.key')
  }
});

app.get('/register', mfaHandlers.registerHandler);
app.get('/qr', mfaHandlers.qrCodeHandler);
app.get('/token', mfaHandlers.generateTokenHandler);

app.use(mfaHandlers.validateMiddleware);

app.get('/test', (req, res) => {
  res.send('test success');
});

app.listen(8080, () => {
  console.log('listening on 8080');
});