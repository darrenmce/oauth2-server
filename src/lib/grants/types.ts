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
  validate(T): Promise<User>
}
export type Grants = {
  [grant: string]: IGrant<GrantValidate>
}

export enum SupportedGrantType {
  password = "password",
  mfaPassword = "urn:rangle.io:oauth2:grant_type:mfa_password",
  authorizationCode = "authorization_code"
}

export enum UnsupportedGrantType {
  clientCredentials = "client_credentials"
}

export type User = {
  username: string,
  fullname: string
};
