import { ClientCredentials } from './ClientCredentials';
import { Password } from './Password';
import { MFAClientCredentials } from './MFAClientCredentials';
import { MFAPassword } from './MFAPassword';

export type Username = string;

export type BasicAuth = {
  username: Username,
  password: string
}

export type Grants = {
  clientCredentials: ClientCredentials
  password: Password,
  mfaClientCredentials: MFAClientCredentials,
  mfaPassword: MFAPassword
}

export enum GrantType {
  clientCredentials = "client_credentials",
  password = "password",
  mfaClientCredentials = "urn:rangle.io:oauth2:grant_type:mfa_client_credentials",
  mfaPassword = "urn:rangle.io:oauth2:grant_type:mfa_password"
}
