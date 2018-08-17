import * as TokenGenerator from 'uuid-token-generator';
import { promisify } from 'bluebird';
import { RedisClient } from 'redis';
import { AuthCode, AuthCodeConsume, AuthCodeValues, IAuthorizationCodeStore } from './types';

const DEFAULT_TTL_SECONDS = 30;
const JSON_PREFIX = '~JSON~';

export class RedisAuthorizationCodeStore implements IAuthorizationCodeStore {
  private readonly tokenGenerator: TokenGenerator;

  static setValue(json: any): string {
    try {
      return `${JSON_PREFIX}${JSON.stringify(json)}`;
    } catch {
      return json;
    }
  }

  static getValue(str: string): any {
    try {
      if (str.startsWith(JSON_PREFIX)) {
        return JSON.parse(str.slice(JSON_PREFIX.length));
      }
      return str;
    } catch {
      return str;
    }
  }

  constructor(
    private readonly redis: RedisClient,
    private readonly namespace: string,
    private authCodeTTLSeconds: number = DEFAULT_TTL_SECONDS
  ) {
    this.tokenGenerator = new TokenGenerator;
  }

  protected formatKey(key: string):string {
    return `${this.namespace}:${key}`;
  }

  generate(authCodeValues: AuthCodeValues): Promise<AuthCode> {
    const setex = promisify(this.redis.setex).bind(this.redis);

    const authCode = this.tokenGenerator.generate(128, TokenGenerator.BASE58);
    console.log(`AuthorizationCodeStore: generating code for ${authCodeValues.username}: ${authCode}`);
    return setex(this.formatKey(authCode), this.authCodeTTLSeconds, RedisAuthorizationCodeStore.setValue(authCodeValues))
      .then(() => authCode);
  }

  async consume(authCode: AuthCode, { redirectURI }: AuthCodeConsume): Promise<AuthCodeValues> {
    const get = promisify(this.redis.get).bind(this.redis);
    const del = promisify(this.redis.del).bind(this.redis);

    const codeValues = RedisAuthorizationCodeStore.getValue(await get(this.formatKey(authCode))) as AuthCodeValues;
    if (!codeValues) {
      throw new Error('Invalid Authorization Code');
    }
    if (redirectURI !== codeValues.redirectURI) {
      throw new Error('Invalid Authorization Code');
    }
    await del(authCode);

    return codeValues;
  }

}