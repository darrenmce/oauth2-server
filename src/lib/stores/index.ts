import { StoresConfig } from '../../config/types';
import { AuthCodeValues, DBClients, Stores } from './types';
import { keyStoreFactory } from './key-store-factory';
import { credentialsStoreFactory } from './credentials-store-factory';
import { authCodeStoreFactory } from './auth-code-store-factory';
import { MemoryGPGChallengeStore } from './MemoryGPGChallengeStore';
import { MemoryConsumableTokenStore } from './MemoryConsumableTokenStore';

export function createStores(config: StoresConfig, dbClients: DBClients): Stores {
  return {
    keyStore: keyStoreFactory(config.key, dbClients),
    credentialsStore: credentialsStoreFactory(config.credentials, dbClients),
    authCodeStore: authCodeStoreFactory(config.authCode, dbClients),
    encryptionChallengeStore: new MemoryGPGChallengeStore(),
    oneTimeSignInStore: new MemoryConsumableTokenStore<AuthCodeValues>()
  }
}
