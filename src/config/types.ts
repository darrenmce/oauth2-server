import { StoreType } from '../lib/stores/types';

export type RouterConfig = {
  mfaTokenHeader: string
}

export type RedisConfig = {
  host?: string,
  port?: number
}

export type StoresConfig = {
  redis: RedisConfig
};

export type StoreTypesConfig = {
  key: StoreType,
  authCode: StoreType,
  credentials: StoreType
}

export type OAuthConfig = {
  router: RouterConfig,
  storeTypes: StoreTypesConfig,
  stores: StoresConfig
}