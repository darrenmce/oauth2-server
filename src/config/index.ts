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
  },
  services: {
    mailer: {
      type: 'sendgrid',
      apiKey: '',
      emailConfig: {
        oneTimeSignIn: {
          from: {
            email: 'no-reply-auth@darrenmce.com',
            name: 'OAuth 2 Server'
          },
          templateId: 'd-c52fd2e6fc22477fb800e02da5422b91'
        }
      }
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
