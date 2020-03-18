import rc from 'rc';
import { OAuthConfig } from './types';
import { StoreType } from '../lib/stores/types';
import { stdSerializers } from 'bunyan';
import { oAuthSerializers } from '../lib/logger/serializers';
const { name } = require('../../package.json');

const defaultConfig: OAuthConfig = {
  auth: {
    register: {
      maxPasswordLength: 100,
      issuer: 'OAuth2-Server',
      passwordRules: undefined
    }
  },
  server: {
    port: 8080,
    log: {
      name,
      level: 'info',
      serializers: {
        ...stdSerializers,
        ...oAuthSerializers
      }
    }
  },
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

  return rc(name, defaultConfig) as OAuthConfig;
}
