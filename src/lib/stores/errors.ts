export class AccountExistsError extends Error {
  constructor() {
    super('Account exists already');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AccountDoesNotExistError extends Error {
  constructor() {
    super('Account does not exist');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GrantNotAllowedError extends Error {
  constructor(recommendedGrant?: string) {
    super(`Grant not allowed${recommendedGrant ? ' - please use ' + recommendedGrant: ''}`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
