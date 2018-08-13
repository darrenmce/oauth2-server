import * as Bluebird from 'bluebird';
import { IKeyStore } from '../stores/types';
import { BasicAuth, Username } from './types';
import { Password } from './Password';

export class MFAPassword {
  constructor(
    private readonly passwordGrant: Password,
    private readonly keyStore: IKeyStore
  ) {}

  validate(basicAuth: BasicAuth, mfaToken: string): PromiseLike<Username> {
    return Bluebird.resolve(this.passwordGrant.validate(basicAuth))
      .then(username => {
        if (!username) {
          return undefined;
        }
        return this.keyStore.verify(username, mfaToken)
          .then(result => result ? username : undefined);
      });
  }
}