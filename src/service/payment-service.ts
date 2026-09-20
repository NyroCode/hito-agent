import { randomUUID } from 'node:crypto';
import { check } from '../domain/errors.ts';
import { authorize } from '../domain/model.ts';
import type { Actor,Intent } from '../domain/model.ts';
import type { ChainPort,ChainResult } from '../stellar/port.ts';
import { WorkService } from './work-service.ts';
const PENDING=['SUBMITTING','SUBMITTED','UNKNOWN'];
export const PREPARATION_LEASE_SECONDS=300;
export class PaymentService {
  work:WorkService;chain:ChainPort;
  constructor(work:WorkService,chain:ChainPort){this.work=work;this.chain=chain;}
  private save(i:Intent){const w=this.work.store.get<{projectId:string}>('work',i.workId)!;this.work.store.put('intent',i.id,w.projectId,i);}
  async build(a:Actor,iid:string){
    let i=this.work.intent(a,iid);const w=this.work.work(a,i.workId);authorize(a,w.projectId,true);
    if(i.status==='READY'){
      if((i.expiresAt??0)>this.work.now())return {...this.work.publicIntent(i),unsignedXdr:i.unsignedXdr};
      check(i.signedXdr===null,'EXPIRED','Signed envelope exists; reconcile before preparing a new transaction',409);
      let r:ChainResult;try{r=await this.chain.lookup(i.txHash!,i.expiresAt??undefined);}catch{r={status:'UNKNOWN',error:'RPC unavailable'};}
      if(r.status==='SUCCESS'){this.apply(a,i,r);check(false,'EXPIRED','Transaction already confirmed on-chain; refresh state',409);}
      check(r.status==='FAILED','EXPIRED','Reconcile this intent before preparing a new transaction',409);
      const attempt=randomUUID();
      this.work.store.transaction(()=>{i=this.work.intent(a,iid);check(i.status==='READY','STATE','Intent changed while regenerating',409);i={...i,status:'PREPARING',preparingAt:this.work.now(),buildAttempt:attempt};this.save(i);});
      try{
        const p=await this.chain.prepare(i,w,this.work.project(a,w.projectId));
        this.work.store.transaction(()=>{const current=this.work.intent(a,iid);check(current.status==='PREPARING'&&current.buildAttempt===attempt,'STATE','Preparation lease no longer belongs to this build',409);i={...current,...p,status:'READY',error:null,preparingAt:null,buildAttempt:null};this.save(i);this.work.store.audit(a.id,'intent.built',w.projectId,i.id,{txHash:i.txHash,regenerated:true});});
        return {...this.work.publicIntent(i),unsignedXdr:i.unsignedXdr};
      }catch(e){
        this.work.store.transaction(()=>{const current=this.work.intent(a,iid);if(current.status==='PREPARING'&&current.buildAttempt===attempt){i={...current,status:'BUILD_FAILED',error:'Build/simulation failed. No signed transaction was submitted.',preparingAt:null,buildAttempt:null};this.save(i);this.work.store.unlock(i.source,i.id);}});throw e;
      }
    }
    check(i.status==='REQUESTED','STATE','Intent is not ready to build; inspect/reconcile current state',409);
    const attempt=randomUUID();
    this.work.store.transaction(()=>{i=this.work.intent(a,iid);check(i.status==='REQUESTED','STATE','Already being prepared',409);this.work.store.acquire(i.source,i.id);i={...i,status:'PREPARING',preparingAt:this.work.now(),buildAttempt:attempt};this.save(i);});
    try{
      const p=await this.chain.prepare(i,w,this.work.project(a,w.projectId));
      this.work.store.transaction(()=>{const current=this.work.intent(a,iid);check(current.status==='PREPARING'&&current.buildAttempt===attempt,'STATE','Preparation lease no longer belongs to this build',409);i={...current,...p,status:'READY',error:null,preparingAt:null,buildAttempt:null};this.save(i);this.work.store.audit(a.id,'intent.built',w.projectId,i.id,{txHash:i.txHash});});
      return {...this.work.publicIntent(i),unsignedXdr:i.unsignedXdr};
    }catch(e){
      this.work.store.transaction(()=>{const current=this.work.intent(a,iid);if(current.status==='PREPARING'&&current.buildAttempt===attempt){i={...current,status:'BUILD_FAILED',error:'Build/simulation failed. No signed transaction was submitted.',preparingAt:null,buildAttempt:null};this.save(i);this.work.store.unlock(i.source,i.id);}});throw e;
    }
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
    let r:ChainResult;try{r=await this.chain.lookup(i.txHash,i.expiresAt??undefined);}catch{r={status:'UNKNOWN',error:'RPC unavailable. No final status inferred.'};}
    // Reading NOT_FOUND for an unsigned READY intent must not prevent signing it before expiry.
    if(r.status==='UNKNOWN'&&i.status==='READY')return this.work.publicIntent(i);
    return this.apply(a,i,r);
  }
  async recover(a:Actor,iid:string){
    let i=this.work.intent(a,iid);const w=this.work.work(a,i.workId);authorize(a,w.projectId,true);
    if(i.status==='SUCCESS'||i.status==='FAILED'||i.status==='BUILD_FAILED')return this.work.publicIntent(i);
    if(i.status==='PREPARING'){
      check(i.txHash===null&&i.signedXdr===null,'RECOVERY_BLOCKED','Preparation contains transaction material; keep the source lock and investigate',409);
      check(typeof i.preparingAt==='number','RECOVERY_BLOCKED','Legacy preparation has no auditable lease timestamp; keep the source lock',409);
      check(i.preparingAt+PREPARATION_LEASE_SECONDS<=this.work.now(),'PREPARATION_ACTIVE','Preparation lease is still active',409);
      return this.work.store.transaction(()=>{
        const current=this.work.intent(a,iid);
        check(current.status==='PREPARING'&&current.buildAttempt===i.buildAttempt,'STATE','Intent changed while recovery was requested',409);
        check(typeof current.preparingAt==='number'&&current.preparingAt+PREPARATION_LEASE_SECONDS<=this.work.now(),'PREPARATION_ACTIVE','Preparation lease is still active',409);
        i={...current,status:'BUILD_FAILED',error:'Expired preparation recovered before any unsigned transaction was published or signed.',preparingAt:null,buildAttempt:null};
        this.save(i);this.work.store.unlock(i.source,i.id);this.work.store.audit(a.id,'intent.preparation_recovered',w.projectId,i.id,{previousStatus:'PREPARING'});
        return this.work.publicIntent(i);
      });
    }
    check(i.status==='READY','RECOVERY_BLOCKED','Only a stale preparation or expired unsigned transaction can use recovery',409);
    check((i.expiresAt??0)<=this.work.now(),'PREPARATION_ACTIVE','Unsigned transaction has not expired',409);
    check(i.txHash,'STATE','No transaction hash available for reconciliation',409);
    let r:ChainResult;try{r=await this.chain.lookup(i.txHash,i.expiresAt??undefined);}catch{r={status:'UNKNOWN',error:'RPC unavailable. No final status inferred.'};}
    if(r.status==='SUCCESS'||r.status==='FAILED')return this.apply(a,i,r);
    this.work.store.transaction(()=>{const current=this.work.intent(a,iid);if(current.status==='READY')this.work.store.audit(a.id,'intent.recovery_blocked',w.projectId,i.id,{status:r.status,hash:i.txHash});});
    check(false,'RECOVERY_BLOCKED','Expired READY cannot be unlocked: UNKNOWN/NOT_FOUND does not prove the transaction was never included',409);
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
