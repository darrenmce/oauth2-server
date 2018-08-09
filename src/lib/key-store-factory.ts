import * as authenticator from 'authenticator';

export enum KeyStoreType {
  memory = "MEMORY",
  redis = "REDIS"
}

const VERIFY_DELTA_THRESHOLD = 2;

export interface IKeyStore {
  create(account: string): Promise<MFAKey>
  verify(account: string, token: number): Promise<boolean>
}

export type MFAKey = string;


export function keyStoreFactory(type: KeyStoreType): IKeyStore {
  if (type === KeyStoreType.memory) {
    return new MemoryKeyStore();
  }
}

export class AccountExistsError extends Error {
  constructor() {
    super('account exists already');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccountDoesNotExistError extends Error {
  constructor() {
    super('account does not exist');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

type KeyStoreMap = { [account: string]: Promise<MFAKey> };

class MemoryKeyStore implements IKeyStore {
  private keys: KeyStoreMap;
  constructor() {
    this.keys = {};
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

  verify(account: string, token: number): Promise<boolean> {
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