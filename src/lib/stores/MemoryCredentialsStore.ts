import bcrypt from 'bcryptjs';
import { CredentialsMetaData, ICredentialsStore } from './types';
import { BasicAuth, Username } from '../grants/types';
import { AccountExistsError } from './errors';

type MemoryCredentialsMap = { [account: string]: Promise<string> };

export class MemoryCredentialsStore implements ICredentialsStore {
  private users: MemoryCredentialsMap;
  private metaData: any;
  constructor() {
    this.users = {};
    this.metaData = {}
  }

  create({ username, password }: BasicAuth, metaData: CredentialsMetaData): Promise<boolean> {
    if (this.users[username]) {
      return Promise.reject(new AccountExistsError());
    }
    this.users[username] = bcrypt.hash(password, 8);
    this.metaData[username] = metaData;
    return this.users[username].then(() => true);
  }

  exists(username: Username): Promise<boolean> {
    return Promise.resolve(!!this.users[username]);
  }

  async validate({ username, password }: BasicAuth): Promise<boolean> {
    if (!this.users[username]) {
      return false;
    }
    return this.users[username]
      .then(passHash => bcrypt.compare(password, passHash));
  }

  getMetadata(username: Username): Promise<CredentialsMetaData> {
    return Promise.resolve(this.metaData[username]);
  }
}
