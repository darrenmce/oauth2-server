import * as authenticator from 'authenticator';
import { promisify } from 'bluebird';
import { RedisClient } from 'redis';

import { AccountDoesNotExistError, AccountExistsError } from './errors';
import { IKeyStore, MFAKey } from './types';

const VERIFY_DELTA_THRESHOLD = 2;

export class RedisKeyStore implements IKeyStore {
  protected static generateKey(): Promise<MFAKey> {
    return Promise.resolve(authenticator.generateKey());
  }

  constructor(
    private readonly redis: RedisClient,
    private readonly namespace: string,
  ) {}

  protected formatKey(key: string):string {
    return `${this.namespace}:${key}`;
  }

  async create(username: string): Promise<MFAKey> {
    const set = promisify(this.redis.set).bind(this.redis);

    if (await this.isEnabled(username)) {
      throw new AccountExistsError();
    }

    const key = RedisKeyStore.generateKey();
    await set(this.formatKey(username), key);
    return key;
  }

  isEnabled(username: string): Promise<boolean> {
    const exists = promisify(this.redis.exists).bind(this.redis);
    return exists(this.formatKey(username));
  }

  async verify(username: string, token: string): Promise<boolean> {
    const get = promisify(this.redis.get).bind(this.redis);

    if (!this.isEnabled(username)) {
      throw new AccountDoesNotExistError();
    }

    const key = await get(this.formatKey(username));

    const verifyResult = authenticator.verifyToken(key, token);

    if (!verifyResult) {
      return false;
    }
    return verifyResult.delta < VERIFY_DELTA_THRESHOLD;
  }
}