import * as Bluebird from 'bluebird';
import * as authenticator from 'authenticator';
import * as jwt from 'jsonwebtoken';
import * as qrcode from 'qrcode';
import { AccountExistsError, IKeyStore, MFAKey } from './lib/key-store-factory';
import { Request, Response, NextFunction } from 'express';

type RSAKeyPair = {
  priv: Buffer,
  pub: Buffer
}

const RSA256_ALGORITHM = 'RS256';

interface AuthRequest extends Request {
  auth?: any
}

export class MFAExpress {

  constructor(
    private jwtKeys: RSAKeyPair,
    private issuer: string,
    private tokenHeader: string,
    private keyStore: IKeyStore
  ) {
    this.register = this.register.bind(this);
    this.validate = this.validate.bind(this);
    this.login = this.login.bind(this);
  }

  protected renderQRCode(account: string, mfaKey: MFAKey): Promise<string> {
    const uri = authenticator.generateTotpUri(mfaKey, account, this.issuer, 'SHA1', 6, 30);
    return qrcode.toDataURL(uri)
      .then(data => `<html><img src="${data}" /></html>`);
  }

  validate(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.header(this.tokenHeader);
    if (!token) {
      return res.sendStatus(403);
    }
    jwt.verify(token, this.jwtKeys.pub, { algorithms: [RSA256_ALGORITHM] }, (err, decoded) => {
      if (err) {
        return res.sendStatus(401);
      }
      req.auth = decoded;
      next();
    });
  }

  register(req: Request, res: Response) {
    const { keyStore } = this;
    const { account } = req.query;
    if (!account) {
      return res.sendStatus(400);
    }
    Bluebird.resolve(keyStore.create(account))
      .then(key => {
        if (!key) {
          return res.sendStatus(500);
        }
        return this.renderQRCode(account, key)
          .then(html => {
            res.status(201).send(html);
          });
      })
      .catch(AccountExistsError, () =>
        res.status(400).send('Account already exists'))
  }

  login(req: Request, res: Response) {
    const { keyStore, jwtKeys } = this;
    const { account, token } = req.query;
    if (!account || !token) {
      return res.sendStatus(400);
    }
    keyStore.verify(account, token)
      .then(verifyResult => {
        if (!verifyResult) {
          return res.status(403).send('MFA token was not verified');
        }
        jwt.sign({ foo: 'bar', account }, jwtKeys.priv, { algorithm: RSA256_ALGORITHM }, (err, jToken) => {
          if (err) {
            return res.status(500).send(err.message);
          }
          res.send(jToken);
        });
      });
  }
}

