import * as R from 'ramda';
import { ICredentialsStore } from '../stores/types';
import { BasicAuth, Username } from './types';

enum ClientCredentialsAuthType {
  basic = "Basic"
}


export class ClientCredentials {
  constructor(
    private readonly credentialsStore: ICredentialsStore
  ) {}

  protected static getAuthType: (authHeader: string) => ClientCredentialsAuthType = R.pipe(
    R.split(' '),
    R.head()
  );

  protected static getBasicAuth(header: string): BasicAuth | null {
    if (!header) {
      return null;
    }
    const authTuple = header.split(' ');
    if (authTuple.length !== 2) {
      return null
    }
    const base64 = authTuple[1];
    const [ username, password ] = new Buffer(base64, 'base64').toString('ascii').split(':');
    return {
      username,
      password
    }
  }

  protected basicValidate(authHeader: string): Promise<Username> {
    const basicAuth = ClientCredentials.getBasicAuth(authHeader);
    if (!basicAuth) {
      return Promise.reject(new Error('Invalid authorization header'));
    }
    return this.credentialsStore.validate(basicAuth)
      .then(res => res ? basicAuth.username : undefined);
  }

  validate(authHeader: string): Promise<Username> {
    if (!authHeader) {
      return Promise.reject(new Error('Authorization header required'));
    }
    const authType = ClientCredentials.getAuthType(authHeader);
    switch(authType) {
      case ClientCredentialsAuthType.basic:
        return this.basicValidate(authHeader);
      default:
        return Promise.reject(new Error(`Unknown authorization type: ${authType}`))
    }
  }
}