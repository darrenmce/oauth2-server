import * as authenticator from 'authenticator';
import * as jwt from 'jsonwebtoken';
import * as qrcode from 'qrcode';
import { IKeyStore } from './lib/key-store-factory';

type MFAHandlersOptions = {
  jwtKeys: RSAKeyPair,
  issuer: string,
  tokenHeader: string,
  keyStore: IKeyStore
}

type RSAKeyPair = {
  priv: Buffer,
  pub: Buffer
}

const RSA256_ALGORITHM = 'RS256';

type MFAHandlers = {
  registerHandler(req, res),
  validateMiddleware(req, res, next),
  generateTokenHandler(req, res),
  qrCodeHandler(req, res)
}

export function createMFAHandlers({ jwtKeys, issuer, tokenHeader, keyStore }: MFAHandlersOptions): MFAHandlers {

  function qrCodeHandler(req, res) {
    const {account} = req.query;
    const mfaKey = keyStore.get(account);
    if (!mfaKey) {
      return res.sendStatus(404);
    }
    const uri = authenticator.generateTotpUri(mfaKey, account, issuer, 'SHA1', 6, 30);
    qrcode.toDataURL(uri, (err, url) => {
      res.send(`<html><img src="${url}"/></html>`);
    });
  }

  function validateMiddleware(req, res, next) {
    const token = req.header(tokenHeader);
    if (!token) {
      return res.sendStatus(403);
    }
    jwt.verify(token, jwtKeys.pub, { algorithms: [RSA256_ALGORITHM] }, (err, decoded) => {
      if (err) {
        return res.sendStatus(401);
      }
      req.auth = decoded;
      next();
    });
  }

  function generateTokenHandler(req, res) {
    const { account, token } = req.query;
    if (!account || !token) {
      return res.sendStatus(400);
    }
    const mfaKey = keyStore.get(account);
    if (!mfaKey) {
      return res.sendStatus(404);
    }
    const verifyMFAToken = authenticator.verifyToken(mfaKey, token);
    if (!verifyMFAToken) {
      return res.sendStatus(403);
    }
    jwt.sign({ foo: 'bar' }, jwtKeys.priv, { algorithm: RSA256_ALGORITHM }, (err, jToken) => {
      if (err) {
        return res.sendStatus(500);
      }
      res.send(jToken);
    });
  }

  function registerHandler(req, res) {
    const { account } = req.query;
    if (!account) {
      return res.sendStatus(400);
    }
    if (keyStore.get(account)) {
      return res.status(401).send('account exists');
    }
    keyStore.create(account);
    res.sendStatus(201);
  }

  return {
    validateMiddleware,
    generateTokenHandler,
    qrCodeHandler,
    registerHandler
  }
}
