import { Grants, GrantType, UNSUPPORTED_GRANT } from './types';
import { Password } from './Password';
import { Stores } from '../stores/types';
import { MFAPassword } from './MFAPassword';
import { AuthorizationCode } from './AuthorizationCode';

export function createGrants(stores: Stores): Grants {
  const passwordGrant = new Password(stores.credentialsStore);
  return {
    [GrantType.password]: passwordGrant,
    [GrantType.mfaPassword]: new MFAPassword(passwordGrant, stores.keyStore),
    [GrantType.authorizationCode]: new AuthorizationCode(stores.authCodeStore, stores.credentialsStore),
    [GrantType.clientCredentials]: UNSUPPORTED_GRANT
  }
}
