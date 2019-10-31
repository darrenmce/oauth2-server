import { AuthCode, AuthCodeConsume } from '../stores/types';

export type Username = string;

export type BasicAuth = {
  username: Username,
  password: string
}

export type PasswordValidate = BasicAuth;

export type MFAPasswordValidate = {
  passwordValidate: PasswordValidate,
  mfaToken: string
}

export type AuthorizationCodeValidate = {
  clientAuth: BasicAuth,
  authCode: AuthCode,
  authCodeParams: AuthCodeConsume
}

export type GrantValidate = PasswordValidate | MFAPasswordValidate | AuthorizationCodeValidate;

export interface IGrant<T> {
  validate(grantData: T): Promise<User>
}

export const UNSUPPORTED_GRANT = 'unsupported_grant';

export type Grants = Record<GrantType, IGrant<GrantValidate> | typeof UNSUPPORTED_GRANT>;

export enum GrantType {
  password = "password",
  mfaPassword = "urn:darrenmce:oauth2:grant_type:mfa_password",
  authorizationCode = "authorization_code",
  clientCredentials = "client_credentials"
}

export type User = {
  username: string,
  fullname: string
};
