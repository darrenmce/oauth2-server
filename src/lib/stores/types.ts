import { BasicAuth } from '../grants/types';

export enum CredentialsStoreType {
  memory = "MEMORY"
}

export enum KeyStoreType {
  memory = "MEMORY"
}

export interface ICredentialsStore {
  create(auth: BasicAuth): Promise<boolean>
  validate(auth: BasicAuth): Promise<boolean>
}

export type MFAKey = string;

export interface IKeyStore {
  create(account: string): Promise<MFAKey>
  verify(account: string, token: string): Promise<boolean>
  isEnabled(account:string): Promise<boolean>
}

export type Stores = {
  keyStore: IKeyStore,
  credentialsStore: ICredentialsStore
}