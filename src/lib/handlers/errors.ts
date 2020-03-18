/*
invalid_request
     The request is missing a required parameter, includes an
     invalid parameter value, includes a parameter more than
     once, or is otherwise malformed.

unauthorized_client
     The client is not authorized to request an authorization
     code using this method.

access_denied
     The resource owner or authorization server denied the
     request.

unsupported_response_type
     The authorization server does not support obtaining an
     authorization code using this method.

invalid_scope
     The requested scope is invalid, unknown, or malformed.

server_error
     The authorization server encountered an unexpected
     condition that prevented it from fulfilling the request.
     (This error code is needed because a 500 Internal Server
     Error HTTP status code cannot be returned to the client
     via an HTTP redirect.)

temporarily_unavailable
     The authorization server is currently unable to handle
     the request due to a temporary overloading or maintenance
     of the server.  (This error code is needed because a 503
     Service Unavailable HTTP status code cannot be returned
     to the client via an HTTP redirect.)

 */

/*
invalid_request
     The request is missing a required parameter, includes an
     unsupported parameter value (other than grant type),
     repeats a parameter, includes multiple credentials,
     utilizes more than one mechanism for authenticating the
     client, or is otherwise malformed.

invalid_client
     Client authentication failed (e.g., unknown client, no
     client authentication included, or unsupported
     authentication method).  The authorization server MAY
     return an HTTP 401 (Unauthorized) status code to indicate
     which HTTP authentication schemes are supported.  If the
     client attempted to authenticate via the "Authorization"
     request header field, the authorization server MUST
     respond with an HTTP 401 (Unauthorized) status code and
     include the "WWW-Authenticate" response header field
     matching the authentication scheme used by the client.

invalid_grant
     The provided authorization grant (e.g., authorization
     code, resource owner credentials) or refresh token is
     invalid, expired, revoked, does not match the redirection
     URI used in the authorization request, or was issued to
     another client.

unauthorized_client
     The authenticated client is not authorized to use this
     authorization grant type.

unsupported_grant_type
     The authorization grant type is not supported by the
     authorization server.
 */

import { NextFunction, Response } from 'express';
import { constructURL } from '../util/obj-to-querystring';

export enum OAuthErrorType {
  invalidGrant = 'invalid_grant',
  invalidClient = 'invalid_client',
  invalidRequest = 'invalid_request',
  unsupportedGrantType = 'unsupported_grant_type',
  unauthorizedClient = 'unauthorized_client',
  accessDenied = 'access_denied',
  unsupportedResponseType = 'unsupported_response_type',
  invalidScope = 'invalid_scope',
  serverError = 'server_error',
  temporarilyUnavailable = 'temporarily_unavailable'
}

const STATUS_CODE_MAP: Record<OAuthErrorType, number> = {
  [OAuthErrorType.invalidGrant]: 400,
  [OAuthErrorType.invalidClient]: 400,
  [OAuthErrorType.invalidRequest]: 400,
  [OAuthErrorType.unsupportedGrantType]: 400,
  [OAuthErrorType.unauthorizedClient]: 401,
  [OAuthErrorType.accessDenied]: 401,
  [OAuthErrorType.unsupportedResponseType]: 400,
  [OAuthErrorType.invalidScope]: 400,
  [OAuthErrorType.serverError]: 500,
  [OAuthErrorType.temporarilyUnavailable]: 503
};

const DEFAULT_ERROR: OAuthErrorType = OAuthErrorType.invalidRequest;

export class ResourceOwnerError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class OAuthError extends Error {
  public readonly statusCode: number;
  constructor(
    public readonly error: OAuthErrorType,
    public readonly error_description?: string,
    public readonly error_uri?: string,
  ) {
    super(error);
    this.statusCode = STATUS_CODE_MAP[error] || STATUS_CODE_MAP[DEFAULT_ERROR];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function oAuthErrorHandler(err: OAuthError | Error, _req, res: Response, next: NextFunction) {
  if (err instanceof OAuthError && !res.headersSent) {
    res.status(err.statusCode).send(`${err.message}${err.error_description ? ' - ' + err.error_description : ''}`);
    return;
  }
  next(err);
}

export function createErrorLocation(baseUrl: string, err: OAuthError) : string {
  return constructURL(baseUrl, {
    error: err.error,
    error_description: err.error_description,
    error_uri: err.error_uri
  });
}
