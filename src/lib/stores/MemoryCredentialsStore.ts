import * as bcrypt from 'bcryptjs';
import * as R from 'ramda';
import { ICredentialsStore } from './types';
import { BasicAuth, Username } from '../grants/types';
import { AccountDoesNotExistError, AccountExistsError } from './errors';

type MemoryCredentialsMap = { [account: string]: Promise<string> };

type CredentialsSeedData = { [account: string]: string };

export class MemoryCredentialsStore implements ICredentialsStore {
  private users: MemoryCredentialsMap;
  constructor(seedData?: CredentialsSeedData) {
    this.users = {};
    if (seedData) {
      R.forEachObjIndexed(
        (password, username: string) => this.create({ username, password }),
        seedData
      );
    }
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