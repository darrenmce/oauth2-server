import { BasicAuth, Username } from '../grants/types';

export enum CredentialsStoreType {
  memory = "MEMORY"
}

export enum KeyStoreType {
  memory = "MEMORY"
}

export enum AuthCodeStoreType {
  memory = "MEMORY"
}

export interface ICredentialsStore {
  create(auth: BasicAuth): Promise<boolean>
  exists(username: Username): Promise<boolean>
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
  credentialsStore: ICredentialsStore,
  authCodeStore: IAuthorizationCodeStore
}

export type AuthCode = string;
export type AuthCodeConsume = {
  redirectURI: string
}
export type AuthCodeValues = AuthCodeConsume & {
  username: string,
  clientId: string,
}

export interface IAuthorizationCodeStore {
  generate(authCodeValues: AuthCodeValues, ttl?: number): Promise<AuthCode>
  consume(authCode: AuthCode, authCodeConsume: AuthCodeConsume): Promise<AuthCodeValues>
}