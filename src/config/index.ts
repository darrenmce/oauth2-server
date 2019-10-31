import rc from 'rc';
import { OAuthConfig } from './types';
import { StoreType } from '../lib/stores/types';
const { name } = require('../../package.json');

const defaultConfig: OAuthConfig = {
  port: 8080,
  stores: {
    authCode: StoreType.memory,
    key: StoreType.memory,
    credentials: StoreType.memory
  },
  dbs: {
    redis: {
      host: 'localhost',
      port: 6379
    }
  }
};

let called = false;
export function getConfig(): OAuthConfig {
  if (called) {
    throw new Error('config was already loaded...');
  }
  called = true;

  return rc(name, defaultConfig);
}
