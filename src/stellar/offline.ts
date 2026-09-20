import { HitoError } from '../domain/errors.ts';
import type { ChainPort } from './port.ts';
export function offlineChain():ChainPort {
  const no=async ():Promise<never>=>{throw new HitoError('TESTNET_NOT_CONFIGURED','Local mode has NO simulated payments. Configure the contract, install SDK dependencies, and run the Testnet gates.',503);};
  return {prepare:no,validateSigned:no,broadcast:no,lookup:no,read:no};
}
