import * as bcrypt from 'bcryptjs';
import { ICredentialsStore } from './types';
import { BasicAuth, Username } from '../grants/types';
import { AccountDoesNotExistError, AccountExistsError } from './errors';

type MemoryCredentialsMap = { [account: string]: Promise<string> };

export class MemoryCredentialsStore implements ICredentialsStore {
  private users: MemoryCredentialsMap;
  constructor() {
    this.users = {};
  }

  create({ username, password }: BasicAuth): Promise<boolean> {
    if (this.users[username]) {
      return Promise.reject(new AccountExistsError());
    }
    this.users[username] = bcrypt.hash(password, 8);
    return this.users[username].then(() => true);
  }

  exists(username: Username): Promise<boolean> {
    return Promise.resolve(!!this.users[username]);
  }

  validate({ username, password }: BasicAuth): Promise<boolean> {
    if (!this.users[username]) {
      return Promise.reject(new AccountDoesNotExistError());
    }
    return this.users[username]
      .then(passHash => bcrypt.compare(password, passHash));
  }
}