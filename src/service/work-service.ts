import { Database } from '../storage/database.ts';
import { check } from '../domain/errors.ts';
import { fields,id,integer,newId,digest,hash,text } from '../domain/primitives.ts';
import { authorize,parseProject,parsePlan,commitment,parseDelivery,readiness,ACTIONS } from '../domain/model.ts';
import type { Actor,Project,Work,Delivery,Intent,Action } from '../domain/model.ts';
export class WorkService {
  store:Database; contractId:string; now:()=>number;
  constructor(store:Database,contractId='UNCONFIGURED_TESTNET_CONTRACT',now=()=>Math.floor(Date.now()/1000)){this.store=store;this.contractId=contractId;this.now=now;}
  project(a:Actor,pid:string) {authorize(a,pid);const p=this.store.get<Project>('project',pid);check(p,'NOT_FOUND','Project not found',404);return p;}
  work(a:Actor,wid:string) {const w=this.store.get<Work>('work',wid);check(w,'NOT_FOUND','Work not found',404);authorize(a,w.projectId);return w;}
  projects(a:Actor){return this.store.list<Project>('project').filter(p=>a.role==='admin'||a.projects.includes(p.id));}
  createProject(a:Actor,body:unknown,key:string){const p=parseProject(body);authorize(a,p.id,true);return this.store.once(`${a.id}:project`,key,body,()=>{check(!this.store.get('project',p.id),'EXISTS','Project already exists; configuration is immutable',409);this.store.put('project',p.id,p.id,p);this.store.audit(a.id,'project.create',p.id,p.id,p);return p;});}
  save(a:Actor,pid:string,body:unknown,key:string) {
    this.project(a,pid);const b=fields(body,['workId','expectedVersion','plan']);
    return this.store.once(`${a.id}:${pid}:save`,key,body,()=>{
      const plan=parsePlan(b.plan,this.now());
      let w:Work;
      if(b.workId){w=this.work(a,id(b.workId));check(w.projectId===pid,'FORBIDDEN','Wrong project',403);check(w.state==='DRAFT','IMMUTABLE','Published agreements cannot be rewritten',409);check(w.version===integer(b.expectedVersion,'expectedVersion',1),'VERSION_CONFLICT','Reload before editing',409);w={...w,plan,version:w.version+1};}
      else {check(b.expectedVersion===undefined,'VALIDATION','expectedVersion only applies to updates');w={id:newId(),projectId:pid,version:1,state:'DRAFT',plan,planHash:null,createdAt:this.now()};}
      this.store.put('work',w.id,pid,w);this.store.audit(a.id,'work.save',pid,w.id,body);return w;
    });
  }
  seal(a:Actor,wid:string,body:unknown,key:string){const initial=this.work(a,wid);authorize(a,initial.projectId,true);const b=fields(body,['expectedVersion']);return this.store.once(`${a.id}:${wid}:seal`,key,body,()=>{let w=this.work(a,wid);check(w.state==='DRAFT','STATE','Already sealed',409);check(w.version===integer(b.expectedVersion,'expectedVersion',1),'VERSION_CONFLICT','Reload before sealing',409);check(w.plan.deadline>this.now(),'DEADLINE','Agreement expired');const p=this.project(a,w.projectId);w={...w,state:'SEALED',version:w.version+1,planHash:commitment(w,p,this.contractId)};this.store.put('work',wid,w.projectId,w);this.store.audit(a.id,'work.seal',w.projectId,wid,w);return w;});}
  deliver(a:Actor,wid:string,body:unknown,key:string){const w=this.work(a,wid);return this.store.once(`${a.id}:${wid}:delivery`,key,body,()=>{const base=parseDelivery(body,w,this.now());const d:Delivery={...base,id:newId(),evidenceHash:digest({schema:'hito.delivery.v1',...base})};this.store.put('delivery',d.id,w.projectId,d);this.store.audit(a.id,'delivery.record',w.projectId,wid,body);return d;});}
  deliveries(a:Actor,wid:string){const w=this.work(a,wid);return this.store.list<Delivery>('delivery',w.projectId).filter(d=>d.workId===wid);}
  delivery(a:Actor,wid:string,mid:string,evidenceHash?:string){const ds=this.deliveries(a,wid).filter(x=>x.milestoneId===mid&&(!evidenceHash||x.evidenceHash===evidenceHash));return ds.at(-1)??null;}
  readiness(a:Actor,wid:string,mid:string){const w=this.work(a,wid);return readiness(w,mid,this.delivery(a,wid,mid));}
  progress(a:Actor,wid:string,body:unknown,key:string){const w=this.work(a,wid);const b=fields(body,['milestoneId','status','note']);const mid=id(b.milestoneId);check(w.plan.milestones.some(m=>m.id===mid),'NOT_FOUND','Milestone not found',404);check(['TODO','IN_PROGRESS','BLOCKED','READY_FOR_REVIEW'].includes(String(b.status)),'VALIDATION','Invalid progress status');const value={workId:wid,milestoneId:mid,status:b.status,note:text(b.note,'note',2000),at:this.now()};return this.store.once(`${a.id}:${wid}:progress`,key,body,()=>{this.store.put('progress',wid+':'+mid,w.projectId,value);this.store.audit(a.id,'progress.record',w.projectId,wid,body);return value;});}
  progressStates(a:Actor,wid:string){const w=this.work(a,wid);return this.store.list<{workId:string}>('progress',w.projectId).filter(p=>p.workId===wid);}
  prepare(a:Actor,wid:string,body:unknown,key:string){const w=this.work(a,wid);const b=fields(body,['action','milestoneId','evidenceHash']);check(w.state==='SEALED','STATE','Seal agreement first',409);check(ACTIONS.includes(b.action as Action),'VALIDATION','Unknown economic action');const action=b.action as Action;const perMilestone=['submit','approve','release'].includes(action);const mid=perMilestone?id(b.milestoneId):null;
    check(perMilestone||b.milestoneId===undefined,'VALIDATION','Unexpected milestone');
    if(mid)check(w.plan.milestones.some(m=>m.id===mid),'NOT_FOUND','Milestone not found',404);
    let evidenceHash:string|null=null;
    if(['submit','approve','release'].includes(action)){
      evidenceHash=hash(b.evidenceHash);const d=this.delivery(a,wid,mid!,evidenceHash);check(d,'NOT_FOUND','Registered evidence not found',404);
      if(action!=='submit'){const r=readiness(w,mid!,d);check(r.readyForHumanReview,'NOT_READY',r.blockers.join(', '),409);}
    }else check(b.evidenceHash===undefined,'VALIDATION','Unexpected evidence hash');
    const p=this.project(a,w.projectId);const source=['accept','submit','request_cancel'].includes(action)?p.payee:p.payer;
    return this.store.once(`${a.id}:${wid}:intent`,key,body,()=>{
      const i:Intent={id:newId(),workId:wid,action,milestoneId:mid,evidenceHash,source,status:'REQUESTED',createdAt:this.now(),expiresAt:null,unsignedXdr:null,signedXdr:null,txHash:null,error:null,ledger:null};this.store.put('intent',i.id,w.projectId,i);this.store.audit(a.id,'intent.request',w.projectId,i.id,body);return this.publicIntent(i);
    });
  }
  intent(a:Actor,iid:string){const i=this.store.get<Intent>('intent',iid);check(i,'NOT_FOUND','Intent not found',404);this.work(a,i.workId);return i;}
  publicIntent(i:Intent){const {signedXdr,unsignedXdr,...out}=i;return {...out,requiresWalletSignature:true};}
  intents(a:Actor,wid:string){const w=this.work(a,wid);return this.store.list<Intent>('intent',w.projectId).filter(i=>i.workId===wid).map(i=>this.publicIntent(i));}
}
