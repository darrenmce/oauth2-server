import * as Bluebird from 'bluebird';
import { ClientCredentials } from './ClientCredentials';
import { IKeyStore } from '../stores/types';
import { Username } from './types';

export class MFAClientCredentials {
  constructor(
    private readonly clientCredentials: ClientCredentials,
    private readonly keyStore: IKeyStore
  ) {}

  validate(authHeader: string, mfaToken: string): PromiseLike<Username> {
    return Bluebird.resolve(this.clientCredentials.validate(authHeader))
      .then(username => {
        if (!username) {
          return undefined;
        }
        return this.keyStore.verify(username, mfaToken)
          .then(result => result ? username : undefined);
      });
  }
}