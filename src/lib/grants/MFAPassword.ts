import * as Bluebird from 'bluebird';
import { IKeyStore } from '../stores/types';
import { BasicAuth, GrantValidatedResponse } from './types';
import { Password } from './Password';

export class MFAPassword {
  constructor(
    private readonly passwordGrant: Password,
    private readonly keyStore: IKeyStore
  ) {}

  validate(basicAuth: BasicAuth, mfaToken: string): PromiseLike<GrantValidatedResponse> {
    return Bluebird.resolve(this.passwordGrant.validate(basicAuth))
      .then(grantValidatedResponse => {
        if (!grantValidatedResponse.validated) {
          return grantValidatedResponse;
        }
        return this.keyStore.verify(basicAuth.username, mfaToken)
          .then(result => result ? grantValidatedResponse : {
            validated: false,
            reason: 'Authorization Failed'
          });
      });
  }
}