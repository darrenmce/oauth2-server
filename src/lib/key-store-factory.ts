import * as authenticator from 'authenticator';

export enum KeyStoreType {
  memory = "MEMORY",
  redis = "REDIS"
}

export interface IKeyStore {
  create(account: string): void
  get(account: string): MFAKey | null
}

type MFAKey = string;


export function keyStoreFactory(type: KeyStoreType): IKeyStore {
  if (type === KeyStoreType.memory) {
    return new MemoryKeyStore();
  }
}

class MemoryKeyStore implements IKeyStore {
  private keys: { [account: string]: string };
  constructor() {
    this.keys = {};
  }

  create(account: string): void {
    this.keys[account] = authenticator.generateKey();
  }

  get(account: string): MFAKey {
    return this.keys[account];
  }
}