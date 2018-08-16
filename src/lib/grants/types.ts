import { Password } from './Password';
import { MFAPassword } from './MFAPassword';
import { AuthorizationCode } from './AuthorizationCode';

export type Username = string;

export type BasicAuth = {
  username: Username,
  password: string
}

export type Grants = {
  password: Password,
  mfaPassword: MFAPassword,
  authorizationCode: AuthorizationCode
}

export enum GrantType {
  password = "password",
  mfaPassword = "urn:rangle.io:oauth2:grant_type:mfa_password",
  authorizationCode = "authorization_code"
}

export type User = {
  username: string,
  fullname: string
};

export type GrantValidatedResponse = {
  user?: User,
  validated: boolean,
  reason?: string
}