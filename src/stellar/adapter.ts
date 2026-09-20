import { check,HitoError } from '../domain/errors.ts';
import { NETWORK,digest } from '../domain/primitives.ts';
import { commitment } from '../domain/model.ts';
import type { Intent,Work,Project,OnchainWork } from '../domain/model.ts';
import type { ChainPort,ChainResult } from './port.ts';
export const TRANSACTION_TIMEOUT_SECONDS=900;

export function submissionOutcome(status:string):ChainResult {
  if(status==='PENDING'||status==='DUPLICATE')return {status:'SUBMITTED'};
  // A submission response is not a ledger receipt. Even ERROR must be reconciled
  // against the original hash before another economic request may use this source.
  return {status:'UNKNOWN',error:'RPC did not confirm inclusion. Reconcile the original hash; do not infer failure or retry payment.'};
}

export function contractArguments(i:Intent,w:Work,p:Project) {
  const wid=digest({namespace:'hito.work.v1',projectId:w.projectId,workId:w.id});
  const idx=i.milestoneId?w.plan.milestones.findIndex(m=>m.id===i.milestoneId):-1;
  const args:{type:'bytes'|'address'|'i128vec'|'u32vec'|'u64'|'u32';value:unknown}[]=[{type:'bytes',value:wid}];
  if(i.action==='create')args.push({type:'address',value:p.payer},{type:'address',value:p.payee},{type:'bytes',value:w.planHash},{type:'i128vec',value:w.plan.milestones.map(m=>m.amountUnits)},{type:'u32vec',value:w.plan.milestones.map(m=>m.dependsOn.reduce((mask,d)=>mask|(1<<w.plan.milestones.findIndex(x=>x.id===d)),0))},{type:'u64',value:w.plan.deadline});
  if(i.action==='accept')args.push({type:'bytes',value:w.planHash});
  if(['submit','approve','release'].includes(i.action)){check(idx>=0,'MILESTONE','Missing milestone');args.push({type:'u32',value:idx},{type:'bytes',value:i.evidenceHash});}
  return {method:i.action,args};
}
function jsonValue(v:unknown):unknown {
  if(typeof v==='bigint')return v.toString();
  if(v instanceof Uint8Array)return Buffer.from(v).toString('hex');
  if(Array.isArray(v))return v.map(jsonValue);
  if(v && typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,jsonValue(x)]));
  return v;
}
export async function stellarChain(contractId:string,rpcUrl:string):Promise<ChainPort> {
  // Dynamic import: local planning/testing does not require third-party packages.
  const S=await import('@stellar/stellar-sdk');
  check(S.StrKey.isValidContract(contractId),'CONFIG','Invalid escrow contract ID');
  const u=new URL(rpcUrl);check(u.protocol==='https:'&&u.hostname==='soroban-testnet.stellar.org'&&u.pathname==='/'&&!u.username&&!u.password,'NETWORK','Only official Testnet RPC accepted by this starter');
  const server=new S.rpc.Server(rpcUrl,{timeout:20});
  async function network(){const n=await server.getNetwork();check(n.passphrase===NETWORK,'NETWORK','RPC is not Stellar Testnet',503);}
  function encode(a:{type:string;value:unknown}) {
    if(a.type==='bytes')return S.xdr.ScVal.scvBytes(Buffer.from(String(a.value),'hex'));
    if(a.type==='address'){check(S.StrKey.isValidEd25519PublicKey(String(a.value)),'ADDRESS','Invalid account checksum');return new S.Address(String(a.value)).toScVal();}
    if(a.type==='i128vec')return S.xdr.ScVal.scvVec((a.value as string[]).map(x=>S.nativeToScVal(BigInt(x),{type:'i128'})));
    if(a.type==='u32vec')return S.xdr.ScVal.scvVec((a.value as number[]).map(x=>S.nativeToScVal(x,{type:'u32'})));
    return S.nativeToScVal(a.type==='u64'?BigInt(a.value as number):a.value,{type:a.type as 'u32'|'u64'});
  }
  async function simulate(source:string,cid:string,method:string,args:ReturnType<typeof encode>[]) {
    const account=await server.getAccount(source);
    const tx=new S.TransactionBuilder(account,{fee:S.BASE_FEE,networkPassphrase:NETWORK}).addOperation(new S.Contract(cid).call(method,...args)).setTimeout(TRANSACTION_TIMEOUT_SECONDS).build();
    const sim=await server.simulateTransaction(tx);
    check(!S.rpc.Api.isSimulationError(sim),'SIMULATION','Contract simulation rejected the operation. Inspect the agreement, role, balance and deadline.',409);
    check(S.rpc.Api.isSimulationSuccess(sim),'RESTORATION_REQUIRED','Contract state may need restoration; do not treat it as a new agreement.',409);
    return {tx,sim};
  }
  async function read(w:Work,p:Project) {
    await network();const wid=digest({namespace:'hito.work.v1',projectId:w.projectId,workId:w.id});
    const {sim}=await simulate(p.payer,contractId,'get',[encode({type:'bytes',value:wid})]);
    check(sim.result,'RPC','Missing contract result',503);return jsonValue(S.scValToNative(sim.result.retval)) as OnchainWork;
  }
  return {
    async prepare(i,w,p){
      await network();check(commitment(w,p,contractId)===w.planHash,'COMMITMENT','Sealed under different configuration. Create a new work after Testnet setup.',409);
      check(S.StrKey.isValidEd25519PublicKey(i.source),'ADDRESS','Invalid signer checksum');check(S.StrKey.isValidContract(p.tokenContract),'ASSET','Invalid token contract checksum');
      const assetResult=await simulate(i.source,contractId,'asset',[]);check(assetResult.sim.result,'ASSET','Could not read escrow asset');
      check(S.scValToNative(assetResult.sim.result.retval)===p.tokenContract,'ASSET','Project asset does not match the deployed escrow',409);
      const decimalsResult=await simulate(i.source,p.tokenContract,'decimals',[]);check(decimalsResult.sim.result,'ASSET','Could not read decimals');
      check(Number(S.scValToNative(decimalsResult.sim.result.retval))===p.decimals,'DECIMALS','Configured asset decimals do not match chain',409);
      if(i.action!=='create'){const state=await read(w,p);check(state.plan_hash===w.planHash&&state.payer===p.payer&&state.payee===p.payee,'CHAIN_MISMATCH','On-chain agreement differs from local commitment',409);}
      const {method,args}=contractArguments(i,w,p);const {tx,sim}=await simulate(i.source,contractId,method,args.map(encode));
      const prepared=S.rpc.assembleTransaction(tx,sim).build();
      return {unsignedXdr:prepared.toXDR(),txHash:Buffer.from(prepared.hash()).toString('hex'),expiresAt:Number(prepared.timeBounds?.maxTime??0)};
    },
    async validateSigned(i,xdr){
      let tx:ReturnType<typeof S.TransactionBuilder.fromXDR>;try{tx=S.TransactionBuilder.fromXDR(xdr,NETWORK);}catch{throw new HitoError('XDR','Invalid signed XDR');}
      check(tx instanceof S.Transaction,'XDR','Fee-bump envelopes not supported in MVP');
      check(tx.source===i.source&&Buffer.from(tx.hash()).toString('hex')===i.txHash,'XDR_MISMATCH','Signed transaction differs from the prepared intent',409);
      const key=S.Keypair.fromPublicKey(i.source);let signedBySource=false;
      for(const sig of tx.signatures){try{if(await key.verify(tx.hash(),sig.signature()))signedBySource=true;}catch{/* ignore invalid signatures */}}
      check(signedBySource,'SIGNATURE','Missing valid signature of the requested wallet',403);
      return tx.toXDR();
    },
    async broadcast(i):Promise<ChainResult>{
      await network();check(i.signedXdr,'STATE','Missing durable signed envelope',409);
      const r=await server.sendTransaction(S.TransactionBuilder.fromXDR(i.signedXdr,NETWORK));
      check(r.hash===i.txHash,'RPC_HASH','Unexpected RPC transaction hash',503);
      return submissionOutcome(r.status);
    },
    async lookup(hash,expiresAt?:number):Promise<ChainResult>{
      await network();const r=await server.getTransaction(hash);
      if(r.status===S.rpc.Api.GetTransactionStatus.SUCCESS)return {status:'SUCCESS',ledger:r.ledger};
      if(r.status===S.rpc.Api.GetTransactionStatus.FAILED)return {status:'FAILED',ledger:r.ledger,error:'Confirmed failed transaction'};
      if(r.status===S.rpc.Api.GetTransactionStatus.NOT_FOUND&&typeof expiresAt==='number'&&expiresAt>0){
        const latestClose=Number(r.latestLedgerCloseTime??0);
        const oldestClose=Number(r.oldestLedgerCloseTime??0);
        if(latestClose>expiresAt&&(oldestClose<=expiresAt||oldestClose===0)){
          return {status:'FAILED',ledger:r.latestLedger,error:'Transaction expired without ledger inclusion past maxTime'};
        }
      }
      return {status:'UNKNOWN',error:'NOT_FOUND is not proof of failure. Keep original hash and envelope.'};
    },read,
  };
}
