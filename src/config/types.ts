import * as Redis from 'redis';
import { LoggerOptions } from 'bunyan';
import { StoreType } from '../lib/stores/types';
import { SendGridConfig } from '../lib/mailer/SendGrid';
import { PASSWORD_RULE } from '../lib/handlers/RegisterHandler';

export type dbConfig = {
  redis: Redis.ClientOpts
};

export type StoresConfig = {
  key: StoreType,
  authCode: StoreType,
  credentials: StoreType
};

export type ServicesConfig = {
  mailer: SendGridConfig
};

export type ServerConfig = {
  port: number,
  log: LoggerOptions
}

export type RegisterConfig = {
  issuer: string,
  maxPasswordLength: number,
  passwordRules?: PASSWORD_RULE[]
};

export type AuthConfig = {
  register: RegisterConfig
}

export type OAuthConfig = {
  auth: AuthConfig,
  server: ServerConfig,
  stores: StoresConfig,
  dbs: dbConfig,
  services: ServicesConfig
};
