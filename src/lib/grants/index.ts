import { Grants } from './types';
import { Password } from './Password';
import { Stores } from '../stores/types';
import { MFAPassword } from './MFAPassword';
import { AuthorizationCode } from './AuthorizationCode';

export function createGrants(stores: Stores): Grants {
  const passwordGrant = new Password(stores.credentialsStore);
  return {
    password: passwordGrant,
    mfaPassword: new MFAPassword(passwordGrant, stores.keyStore),
    authorizationCode: new AuthorizationCode(stores.authCodeStore, stores.credentialsStore)
  }
}