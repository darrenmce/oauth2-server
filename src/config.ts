import * as rc from 'rc';
const { name } = require('../package.json');

export type RouterConfig = {
  mfaTokenHeader: string
}

export type OAuthConfig = {
  router: RouterConfig
}

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