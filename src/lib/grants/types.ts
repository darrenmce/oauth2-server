import { Password } from './Password';
import { MFAPassword } from './MFAPassword';

export type Username = string;

export type BasicAuth = {
  username: Username,
  password: string
}

export type Grants = {
  password: Password,
  mfaPassword: MFAPassword
}

export enum GrantType {
  password = "password",
  mfaPassword = "urn:rangle.io:oauth2:grant_type:mfa_password"
}
