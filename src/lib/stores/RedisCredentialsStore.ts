import * as bcrypt from 'bcryptjs';
import { promisify } from 'bluebird';
import { RedisClient } from 'redis';

import { ICredentialsStore } from './types';
import { BasicAuth, Username } from '../grants/types';
import { AccountDoesNotExistError, AccountExistsError } from './errors';


export class RedisCredentialsStore implements ICredentialsStore {
  constructor(
    private readonly redis: RedisClient,
    private readonly namespace: string,
  ) {}

  protected formatKey(key: string):string {
    return `${this.namespace}:${key}`;
  }

  async create({ username, password }: BasicAuth): Promise<boolean> {
    const set = promisify(this.redis.set).bind(this.redis);

    if (await this.exists(username)) {
      throw new AccountExistsError();
    }

    const passHash = await bcrypt.hash(password, 8);

    return set(this.formatKey(username), passHash)
      .then(() => true);
  }

  exists(username: Username): Promise<boolean> {
    const exists = promisify(this.redis.exists).bind(this.redis);
    return exists(this.formatKey(username));
  }

  async validate({ username, password }: BasicAuth): Promise<boolean> {
    const get = promisify(this.redis.get).bind(this.redis);

    if (!await this.exists(username)) {
      throw new AccountDoesNotExistError();
    }

    return get(this.formatKey(username))
      .then(passHash => bcrypt.compare(password, passHash))
  }
}