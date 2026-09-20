import type { Intent,Work,Project,OnchainWork } from '../domain/model.ts';
export type Prepared = { unsignedXdr:string;txHash:string;expiresAt:number };
export type ChainResult = { status:'SUBMITTED'|'UNKNOWN'|'SUCCESS'|'FAILED';ledger?:number;error?:string };
export interface ChainPort {
  prepare(i:Intent,w:Work,p:Project):Promise<Prepared>;
  validateSigned(i:Intent,xdr:string):Promise<string>;
  broadcast(i:Intent):Promise<ChainResult>;
  lookup(hash:string):Promise<ChainResult>;
  read(w:Work,p:Project):Promise<OnchainWork>;
}
