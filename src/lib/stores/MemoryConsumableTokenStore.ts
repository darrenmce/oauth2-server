import NodeCache from 'node-cache';
import TokenGenerator from 'uuid-token-generator';
import { IConsumableTokenStore } from './types';

const DEFAULT_TTL_SECONDS = 60 * 60; //1hr

export class MemoryConsumableTokenStore<TTokenData> implements IConsumableTokenStore<TTokenData> {
  private tokens: NodeCache;
  private readonly tokenGenerator: TokenGenerator;
  constructor(tokenTTLSeconds: number = DEFAULT_TTL_SECONDS) {
    this.tokens = new NodeCache({ stdTTL: tokenTTLSeconds });
    this.tokenGenerator = new TokenGenerator();
  }

  public async create(tokenData: TTokenData): Promise<string> {
    const token = this.tokenGenerator.generate(128, TokenGenerator.BASE58);
    this.tokens.set(token, tokenData);
    return token;
  }

  public async consume(token: string): Promise<TTokenData | null> {
    const tokenData = this.tokens.get<TTokenData>(token);
    if (!tokenData) {
      return null;
    }
    this.tokens.del(token);
    return tokenData;
  }
}
