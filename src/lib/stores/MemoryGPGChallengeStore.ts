import * as openpgp from 'openpgp';
import TokenGenerator from 'uuid-token-generator';
import {
  EncryptionChallenge,
  EncryptionProof,
  IEncryptionChallengeStore
} from './types';
import { Username } from '../grants/types';

export class MemoryGPGChallengeStore implements IEncryptionChallengeStore {
  private challenges: { [challengeId: string]: any };
  private tokenGenerator: TokenGenerator;
  constructor() {
    this.challenges = {};
    this.tokenGenerator = new TokenGenerator();
  }

  public async generateChallenge(username: Username, publicKey: string): Promise<EncryptionChallenge> {
    const challengeId = this.tokenGenerator.generate(128, TokenGenerator.BASE58);
    const challenge = this.tokenGenerator.generate(256, TokenGenerator.BASE58);
    const { data } = await openpgp.encrypt({
      message: openpgp.message.fromText(challenge),
      publicKeys: (await openpgp.key.readArmored(publicKey)).keys
    });

    this.challenges[challengeId] = {
      challenge,
      username
    };

    return {
      challengeId,
      encryptedMessage: data
    }
  }

  public async validateAndConsumeProof({ username, challengeId, decodedMessage }: EncryptionProof): Promise<boolean> {
    const valid = this.challenges[challengeId] &&
      this.challenges[challengeId].username === username &&
      this.challenges[challengeId].challenge === decodedMessage;

    if (valid) {
      delete this.challenges[challengeId];
    }

    return valid;
  }
}
