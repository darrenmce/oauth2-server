import * as authenticator from 'authenticator';
import * as R from 'ramda';
import { AccountDoesNotExistError, AccountExistsError } from './errors';
import { IKeyStore, MFAKey } from './types';

type KeyStoreMap = { [account: string]: Promise<MFAKey> };

const VERIFY_DELTA_THRESHOLD = 2;

type KeySeedData = { [account: string]: string };

export class MemoryKeyStore implements IKeyStore {
  private keys: KeyStoreMap;
  constructor(seedData?: KeySeedData) {
    this.keys = {};
    if (seedData) {
      this.keys = R.map(key => Promise.resolve(key), seedData);
    }
  }

  private generateKey(): Promise<MFAKey> {
    return Promise.resolve(authenticator.generateKey());
  }

  create(account: string): Promise<MFAKey> {
    if (this.keys[account]) {
      return Promise.reject(new AccountExistsError());
    }
    this.keys[account] = this.generateKey();
    return this.keys[account];
  }

  isEnabled(account: string): Promise<boolean> {
    return Promise.resolve(!!this.keys[account]);
  }

  verify(account: string, token: string): Promise<boolean> {
    if (!this.keys[account]) {
      return Promise.reject(new AccountDoesNotExistError());
    }
    return this.keys[account]
      .then(key => {
        const result = authenticator.verifyToken(key, token);
        if (!result) {
          return false;
        }
        return result.delta < VERIFY_DELTA_THRESHOLD;
      });
  }
}