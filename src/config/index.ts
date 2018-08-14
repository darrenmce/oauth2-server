import * as rc from 'rc';
import { OAuthConfig } from './types';
const { name } = require('../../package.json');

const defaultConfig: OAuthConfig = {
  router: {
    mfaTokenHeader: 'X-Rangle-MFA'
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