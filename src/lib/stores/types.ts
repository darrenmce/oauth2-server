import { BasicAuth, Username } from '../grants/types';
import { RedisClient } from 'redis';

export enum StoreType {
  memory = "MEMORY",
  redis = "REDIS"
}

export type DBClients = {
  redis: RedisClient
}

export type CredentialsMetaData = { [key: string]: string }

export interface ICredentialsStore {
  create(auth: BasicAuth, metaData: CredentialsMetaData): Promise<boolean>
  exists(username: Username): Promise<boolean>
  validate(auth: BasicAuth): Promise<boolean>
  getMetadata(username: Username): Promise<CredentialsMetaData>
}

export type MFAKey = string;

export interface IKeyStore {
  create(account: string): Promise<MFAKey>
  verify(account: string, token: string): Promise<boolean>
  isEnabled(account:string): Promise<boolean>
}

export type EncryptionChallengeID = string;

export type EncryptionChallenge = {
  challengeId: EncryptionChallengeID,
  encryptedMessage: string
}

export type EncryptionProof = {
  username: Username,
  challengeId: EncryptionChallengeID,
  decodedMessage: string
}

export interface IEncryptionChallengeStore {
  generateChallenge(username: Username, publicKey: string): Promise<EncryptionChallenge>
  validateAndConsumeProof(proof: EncryptionProof): Promise<boolean>
}

export interface IConsumableTokenStore<TTokenData> {
  create(tokenData: TTokenData): Promise<string>;
  consume(token: string): Promise<TTokenData | null>;
}

export type Stores = {
  keyStore: IKeyStore,
  credentialsStore: ICredentialsStore,
  authCodeStore: IAuthorizationCodeStore,
  encryptionChallengeStore: IEncryptionChallengeStore,
  oneTimeSignInStore: IConsumableTokenStore<AuthCodeValues>
}

export type AuthCode = string;
export type AuthCodeConsume = {
  redirectURI: string
}
export type AuthCodeValues = AuthCodeConsume & {
  username: string,
  clientId: string,
  state?: string
}

export interface IAuthorizationCodeStore {
  generate(authCodeValues: AuthCodeValues, ttl?: number): Promise<AuthCode>
  consume(authCode: AuthCode, authCodeConsume: AuthCodeConsume): Promise<AuthCodeValues>
}
