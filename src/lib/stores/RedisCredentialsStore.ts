import bcrypt from 'bcryptjs';
import Bluebird from 'bluebird';
import { RedisClient } from 'redis';

import { CredentialsMetaData, ICredentialsStore } from './types';
import { BasicAuth, Username } from '../grants/types';
import { AccountExistsError } from './errors';

export class RedisCredentialsStore implements ICredentialsStore {
  private rGet: (key: string) => Promise<string>;
  private rSet: (key: string, value: string) => Promise<void>;
  private rExists: (key: string) => Promise<boolean>;

  constructor(
    private readonly redis: RedisClient,
    private readonly namespace: string,
  ) {
    this.rGet = Bluebird.promisify(this.redis.get).bind(this.redis);
    this.rSet = Bluebird.promisify(this.redis.set).bind(this.redis);
    this.rExists = Bluebird.promisify(this.redis.exists).bind(this.redis);
  }

  protected formatKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  protected formatMetaKey(key: string): string {
    return `${this.namespace}:meta:${key}`;
  }

  public async create({ username, password }: BasicAuth, metaData: CredentialsMetaData): Promise<true> {
    if (await this.exists(username)) {
      throw new AccountExistsError();
    }

    const passHash = await bcrypt.hash(password, 8);

    await Bluebird.all([
      this.rSet(this.formatKey(username), passHash),
      this.rSet(this.formatMetaKey(username), JSON.stringify(metaData))
    ]);

    return true;
  }

  exists(username: Username): Promise<boolean> {
    return this.rExists(this.formatKey(username));
  }

  public async validate({ username, password }: BasicAuth): Promise<boolean> {
    if (!await this.exists(username)) {
      return false;
    }

    const passHash = await this.rGet(this.formatKey(username));

    return await bcrypt.compare(password, passHash);
  }

  public async getMetadata(username: Username): Promise<CredentialsMetaData> {
    return this.rGet(this.formatMetaKey(username))
      .then(JSON.parse);
  }
}
