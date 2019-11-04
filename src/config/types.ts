import { StoreType } from '../lib/stores/types';
import { SendGridConfig } from '../lib/mailer/SendGrid';

export type RedisConfig = {
  host?: string,
  port?: number
};

export type dbConfig = {
  redis: RedisConfig
};

export type StoresConfig = {
  key: StoreType,
  authCode: StoreType,
  credentials: StoreType
};

export type ServicesConfig = {
  mailer: SendGridConfig
};

export type OAuthConfig = {
  port: number,
  stores: StoresConfig,
  dbs: dbConfig,
  services: ServicesConfig
};
