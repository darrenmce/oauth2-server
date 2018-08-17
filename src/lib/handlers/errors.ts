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

const statusCodes = {
  invalidGrant: 400,
  invalidClient: 400,
  invalidRequest: 400,
  unsupportedGrantType: 400,
  unauthorizedClient: 401,
  accessDenied: 401,
  unsupportedResponseType: 400,
  invalidScope: 400,
  serverError: 500,
  temporarilyUnavailable: 503
};

export class ResourceOwnerError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class OAuthError extends Error {
  public statusCode: number;

  constructor(
    readonly error: OAuthErrorType,
    readonly error_description?: string,
    readonly error_uri?: string,
  ) {
    super(error);
    this.statusCode = statusCodes[error] || 400;
    Object.setPrototypeOf(this, new.target.prototype);
  }
  toQueryString(state?: string): string {
    let qs = `error=${this.error}`;
    if (this.error_description) {
      qs += `&error_description=${this.error_description}`;
    }
    if (this.error_uri) {
      qs += `&error_uri=${this.error_uri}`;
    }
    if (state) {
      qs += `&state=${state}`;
    }
    return qs;
  }
}