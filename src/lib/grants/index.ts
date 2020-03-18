import { Grants, GrantType, UNSUPPORTED_GRANT } from './types';
import { Password } from './Password';
import { Stores } from '../stores/types';
import { MFAPassword } from './MFAPassword';
import { AuthorizationCode } from './AuthorizationCode';
import Logger from 'bunyan';

export function createGrants(log: Logger, stores: Stores): Grants {
  const passwordGrant = new Password(log, stores.credentialsStore);
  return {
    [GrantType.password]: passwordGrant,
    [GrantType.mfaPassword]: new MFAPassword(log, passwordGrant, stores.keyStore),
    [GrantType.authorizationCode]: new AuthorizationCode(log, stores.authCodeStore, stores.credentialsStore),
    [GrantType.clientCredentials]: UNSUPPORTED_GRANT
  }
}
