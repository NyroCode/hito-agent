import { check } from '../domain/errors.ts';
import { authorize } from '../domain/model.ts';
import type { Actor,Intent } from '../domain/model.ts';
import type { ChainPort,ChainResult } from '../stellar/port.ts';
import { WorkService } from './work-service.ts';
const PENDING=['SUBMITTING','SUBMITTED','UNKNOWN'];
export class PaymentService {
  work:WorkService;chain:ChainPort;
  constructor(work:WorkService,chain:ChainPort){this.work=work;this.chain=chain;}
  private save(i:Intent){const w=this.work.store.get<{projectId:string}>('work',i.workId)!;this.work.store.put('intent',i.id,w.projectId,i);}
  async build(a:Actor,iid:string){
    let i=this.work.intent(a,iid);const w=this.work.work(a,i.workId);authorize(a,w.projectId,true);
    if(i.status==='READY'){check((i.expiresAt??0)>this.work.now(),'EXPIRED','Reconcile this intent before preparing a new transaction',409);return {...this.work.publicIntent(i),unsignedXdr:i.unsignedXdr};}
    check(i.status==='REQUESTED','STATE','Intent is not ready to build; inspect/reconcile current state',409);
    this.work.store.transaction(()=>{i=this.work.intent(a,iid);check(i.status==='REQUESTED','STATE','Already being prepared',409);this.work.store.acquire(i.source,i.id);i={...i,status:'PREPARING'};this.save(i);});
    try{const p=await this.chain.prepare(i,w,this.work.project(a,w.projectId));i={...i,...p,status:'READY',error:null};this.work.store.transaction(()=>{this.save(i);this.work.store.audit(a.id,'intent.built',w.projectId,i.id,{txHash:i.txHash});});return {...this.work.publicIntent(i),unsignedXdr:i.unsignedXdr};}
    catch(e){this.work.store.transaction(()=>{i={...i,status:'BUILD_FAILED',error:'Build/simulation failed. No signed transaction was submitted.'};this.save(i);this.work.store.unlock(i.source,i.id);});throw e;}
  }
  async submit(a:Actor,iid:string,signedXdr:string){
    let i=this.work.intent(a,iid);const w=this.work.work(a,i.workId);authorize(a,w.projectId,true);
    if(i.status==='SUCCESS'||i.status==='FAILED'||PENDING.includes(i.status))return this.work.publicIntent(i);
    check(i.status==='READY','STATE','Build and review the transaction first',409);
    check((i.expiresAt??0)>this.work.now(),'EXPIRED','Signature window expired; reconcile first',409);
    const normalized=await this.chain.validateSigned(i,signedXdr);
    this.work.store.transaction(()=>{i=this.work.intent(a,iid);check(i.status==='READY','STATE','Submission already in progress',409);i={...i,status:'SUBMITTING',signedXdr:normalized};this.save(i);this.work.store.audit(a.id,'intent.broadcast_requested',w.projectId,i.id,{txHash:i.txHash});});
    // Once this point is reached, timeout/crash MUST NOT create a new transaction.
    let result:ChainResult;
    try{result=await this.chain.broadcast(i);}catch{result={status:'UNKNOWN',error:'Network outcome unknown. Poll the existing hash; do not submit a new payment.'};}
    return this.apply(a,i,result);
  }
  async reconcile(a:Actor,iid:string){
    const i=this.work.intent(a,iid);if(i.status==='SUCCESS'||i.status==='FAILED')return this.work.publicIntent(i);
    check(i.txHash,'STATE','No transaction hash available for reconciliation',409);
    let r:ChainResult;try{r=await this.chain.lookup(i.txHash);}catch{r={status:'UNKNOWN',error:'RPC unavailable. No final status inferred.'};}
    // Reading NOT_FOUND for an unsigned READY intent must not prevent signing it before expiry.
    if(r.status==='UNKNOWN'&&i.status==='READY')return this.work.publicIntent(i);
    return this.apply(a,i,r);
  }
  private apply(a:Actor,i:Intent,r:ChainResult){
    return this.work.store.transaction(()=>{
      const current=this.work.intent(a,i.id);
      // A slow NOT_FOUND response must never overwrite a confirmed terminal outcome.
      if(current.status==='SUCCESS'||current.status==='FAILED')return this.work.publicIntent(current);
      const next={...current,status:r.status,error:r.error??null,ledger:r.ledger??null};this.save(next);
      if(r.status==='SUCCESS'||r.status==='FAILED')this.work.store.unlock(next.source,next.id);
      const w=this.work.work(a,next.workId);this.work.store.audit(a.id,'intent.reconciled',w.projectId,next.id,{status:r.status,hash:next.txHash});
      return this.work.publicIntent(next);
    });
  }
  async state(a:Actor,wid:string){const w=this.work.work(a,wid);return this.chain.read(w,this.work.project(a,w.projectId));}
}
