import { ICredentialsStore } from '../stores/types';
import { BasicAuth, GrantValidatedResponse, Username } from './types';

export class Password {
  constructor(
    private readonly credentialsStore: ICredentialsStore
  ) {}

  validate(basicAuth: BasicAuth): Promise<GrantValidatedResponse> {
    return this.credentialsStore.validate(basicAuth)
      .then(res => res ? {
        validated: false,
        reason: 'Authorization Failed'
      }: {
        validated: true,
        user: {
          username: basicAuth.username,
          fullname: basicAuth.username
        }
      });
  }
}