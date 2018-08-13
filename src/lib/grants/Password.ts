import { ICredentialsStore } from '../stores/types';
import { BasicAuth, Username } from './types';

export class Password {
  constructor(
    private readonly credentialsStore: ICredentialsStore
  ) {}

  validate(basicAuth: BasicAuth): Promise<Username> {
    return this.credentialsStore.validate(basicAuth)
      .then(res => res ? basicAuth.username : undefined);
  }
}