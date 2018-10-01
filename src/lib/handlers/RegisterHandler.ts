import * as authenticator from 'authenticator';
import * as qrcode from 'qrcode';
import { CredentialsMetaData, MFAKey, Stores } from '../stores/types';
import { NextFunction, Request, Response, Router } from 'express';

export type RegistrationPayload = {
  username: string,
  password: string,
  password_repeat: string,
  mfa?: string
}

type PasswordValidation = {
  result: boolean,
  reason?: string
}

const MAX_PASSWORD_LENGTH = 64;
const PASSWORD_MINLENGTH = /.{8,}/;
const PASSWORD_LOWER = /.*[a-z]/;
const PASSWORD_UPPER = /.*[A-Z]/;
const PASSWORD_NUMBER = /.*[0-9]/;
const PASSWORD_SPECIAL = /.*[!@#\$%\^&\*]/;
const PASSWORD_ACCEPTED_CHARS = /^[A-Za-z0-9!@#\$%\^&\*]*$/;

const PASSWORD_RULES = [
  PASSWORD_MINLENGTH,
  PASSWORD_ACCEPTED_CHARS,
  PASSWORD_LOWER,
  PASSWORD_UPPER,
  PASSWORD_NUMBER,
  PASSWORD_SPECIAL,
];

const HARDCODED_ISSUER = 'Rangle Test Auth';

export class RegisterHandler {
  protected static testPassword(password: string): boolean {
    return PASSWORD_RULES.reduce((valid, regex) => {
      if (!valid) {
        return false
      }
      return regex.test(password);
    }, true);
  }

  protected static renderQRCode(account: string, issuer: string, mfaKey: MFAKey): Promise<string> {
    const uri = authenticator.generateTotpUri(mfaKey, account, issuer, 'SHA1', 6, 30);
    return qrcode.toDataURL(uri);
  }

  constructor(
    private readonly stores: Stores
  ) {}

  protected async validateRegistration({username, password, password_repeat}: RegistrationPayload): Promise<PasswordValidation> {
    const fail = (message) => ({ result: false, reason: message});
    if (await this.stores.credentialsStore.exists(username)) {
      return fail('User is already registered');
    }
    if (password !== password_repeat) {
      return fail('Password mismatch');
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return fail(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`);
    }
    if (!RegisterHandler.testPassword(password)) {
      return fail(`Password too weak`);
    }
    return { result: true };
  }

  getRouter(): Router {
    const router = Router();

    router.get('/', (req: Request, res: Response, next: NextFunction) => {
      res.render('register');
    });

    router.post('/', async (req: Request, res: Response, next: NextFunction) => {
      const validation = await this.validateRegistration(req.body as RegistrationPayload);
      if (!validation.result) {
        return res.render('register', { message: `Registration Failed: ${validation.reason}`});
      }

      const username = req.body.username;
      const metaData: CredentialsMetaData = {};
      if (req.body.keybase_username) {
        metaData.keybase_username = req.body.keybase_username;
      }
      await this.stores.credentialsStore.create(
        {username: username, password: req.body.password},
        metaData
        );
      let qrcode;
      if (req.body.mfa) {
        const mfaKey = await this.stores.keyStore.create(username);
        qrcode = await RegisterHandler.renderQRCode(username, HARDCODED_ISSUER, mfaKey);
      }
      res.render('register', { message: 'Registration complete!', qrcode });
    });

    return router;
  }

}