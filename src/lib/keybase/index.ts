import rp from 'request-promise';

export class KeybaseUtil {
  constructor() {}

  public async getKeybasePublicKey(username: string): Promise<string> {
    return await rp(`https://keybase.io/${username}/pgp_keys.asc`);
  }
}
