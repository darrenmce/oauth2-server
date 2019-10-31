import Joi from 'joi';
import { GrantType } from './types';
import { OAuthError, OAuthErrorType } from '../handlers/errors';

export type GrantRequestBody = PasswordGrantRequestBody | MFAGrantRequestBody | AuthorizationCodeGrantRequestBody;

type PasswordGrantRequestBody = {
  type: GrantType.password,
  username: string,
  password: string
}

type MFAGrantRequestBody = {
  type: GrantType.mfaPassword,
  username: string,
  password: string,
  mfa_token: string
};

type AuthorizationCodeGrantRequestBody = {
  type: GrantType.authorizationCode,
  code: string,
  redirect_uri: string,
  state?: string
}

const passwordSchema = Joi.object({
  username: Joi.string(),
  password: Joi.string()
});

const mfaSchema = Joi.object({
  username: Joi.string(),
  password: Joi.string(),
  mfa_token: Joi.string()
});

const authorizationCodeSchema = Joi.object({
  code: Joi.string(),
  redirect_uri: Joi.string().uri({
    allowRelative: false
  }),
  state: Joi.string().optional()
});

export async function validatePasswordGrantRequestBody(requestBody: any): Promise<PasswordGrantRequestBody> {
  const { error, value } = passwordSchema.validate(requestBody, { stripUnknown: true });
  if (error) {
    throw new OAuthError(OAuthErrorType.invalidRequest, error.details.map(e => e.message).join('\n'))
  }
  return {
    type: GrantType.password,
    ...(value as Omit<PasswordGrantRequestBody, 'type'>)
  };
}

export async function validateMFAGrantRequestBody(requestBody: any): Promise<MFAGrantRequestBody> {
  const { error, value } = mfaSchema.validate(requestBody, { stripUnknown: true });
  if (error) {
    throw new OAuthError(OAuthErrorType.invalidRequest, error.details.map(e => e.message).join('\n'))
  }
  return {
    type: GrantType.mfaPassword,
    ...(value as Omit<MFAGrantRequestBody, 'type'>)
  };
}

export async function validateAuthorizationCodeGrantRequestBody(requestBody: any): Promise<AuthorizationCodeGrantRequestBody> {
  const { error, value } = authorizationCodeSchema.validate(requestBody, { stripUnknown: true });
  if (error) {
    throw new OAuthError(OAuthErrorType.invalidRequest, error.details.map(e => e.message).join('\n'))
  }
  return {
    type: GrantType.authorizationCode,
    ...(value as Omit<AuthorizationCodeGrantRequestBody, 'type'>)
  };
}

