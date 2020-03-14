import authenticator from 'authenticator';
import qrcode from 'qrcode';
import { CredentialsMetaData, MFAKey, Stores } from '../stores/types';
import { Request, Response, Router } from 'express';
import { IRequestHandler } from '../../types/request-handler';
import { asyncWrapHandler } from '../util/async-wrap-handler';
import { RegisterConfig } from '../../config/types';

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

export enum PASSWORD_RULE {
  PASSWORD_MINLENGTH = 'PASSWORD_MINLENGTH',
  PASSWORD_ACCEPTED_CHARS = 'PASSWORD_ACCEPTED_CHARS',
  PASSWORD_LOWER = 'PASSWORD_LOWER',
  PASSWORD_UPPER = 'PASSWORD_UPPER',
  PASSWORD_NUMBER = 'PASSWORD_NUMBER',
  PASSWORD_SPECIAL = 'PASSWORD_SPECIAL'
}

const PASSWORD_RULE_MAP: Record<PASSWORD_RULE, RegExp> = {
  PASSWORD_MINLENGTH: /.{8,}/,
  PASSWORD_LOWER: /.*[a-z]/,
  PASSWORD_UPPER: /.*[A-Z]/,
  PASSWORD_NUMBER: /.*[0-9]/,
  PASSWORD_SPECIAL: /.*[!@#\$%\^&\*]/,
  PASSWORD_ACCEPTED_CHARS: /^[A-Za-z0-9!@#\$%\^&\*]*$/
};

const DEFAULT_PASSWORD_RULES: PASSWORD_RULE[] = [
  PASSWORD_RULE.PASSWORD_MINLENGTH,
  PASSWORD_RULE.PASSWORD_ACCEPTED_CHARS,
  PASSWORD_RULE.PASSWORD_LOWER,
  PASSWORD_RULE.PASSWORD_UPPER,
  PASSWORD_RULE.PASSWORD_NUMBER,
  PASSWORD_RULE.PASSWORD_SPECIAL,
];

export class RegisterHandler implements IRequestHandler {
  protected static testPassword(password: string, passwordRules: PASSWORD_RULE[] = DEFAULT_PASSWORD_RULES): boolean {
    return passwordRules.reduce((valid, rule) => {
      if (!valid) {
        return false
      }
      return PASSWORD_RULE_MAP[rule].test(password);
    }, true);
  }

  protected static renderQRCode(account: string, issuer: string, mfaKey: MFAKey): Promise<string> {
    const uri = authenticator.generateTotpUri(mfaKey, account, issuer, 'SHA1', 6, 30);
    return qrcode.toDataURL(uri);
  }

  constructor(
    private readonly config: RegisterConfig,
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
    if (password.length > this.config.maxPasswordLength) {
      return fail(`Password cannot exceed ${this.config.maxPasswordLength} characters`);
    }
    if (!RegisterHandler.testPassword(password, this.config.passwordRules)) {
      return fail(`Password too weak`);
    }
    return { result: true };
  }

  public getRouter(): Router {
    const router = Router();

    router.get('/', (_req: Request, res: Response) => {
      res.render('register');
    });

    router.post('/', asyncWrapHandler(async (req: Request, res: Response) => {
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
        qrcode = await RegisterHandler.renderQRCode(username, this.config.issuer, mfaKey);
      }
      res.render('register', { message: 'Registration complete!', qrcode });
    }));

    return router;
  }

}
