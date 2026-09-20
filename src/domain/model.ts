import { check } from './errors.ts';
import { fields,text,id,integer,units,sumUnits,hash,link,publicAddress,digest,NETWORK } from './primitives.ts';
export type Actor = { id: string; role: 'admin'|'agent'; projects: string[] };
export type Project = { id: string; name: string; payer: string; payee: string; tokenContract: string; tokenLabel: string; decimals: number };
export type Criterion = { id: string; text: string; evidence: 'self_reported'|'trusted_ci'; };
export type Milestone = { id: string; title: string; amountUnits: string; criteria: Criterion[]; dependsOn: string[] };
export type Plan = { title: string; description: string; deadline: number; totalUnits: string; milestones: Milestone[] };
export type Work = { id: string; projectId: string; version: number; state: 'DRAFT'|'SEALED'; plan: Plan; planHash: string|null; createdAt: number };
export type CheckResult = { criterionId: string; status: 'PASS'|'FAIL'|'NOT_CHECKED'; detail: string };
export type Delivery = { id: string; workId: string; milestoneId: string; planHash: string; artifactHash: string; reference: string; checks: CheckResult[]; provenance: 'self_reported'|'trusted_ci'; createdAt: number; evidenceHash: string };
export const ACTIONS = ['create','accept','fund','submit','approve','release','request_cancel','cancel','refund_expired','touch'] as const;
export type Action = typeof ACTIONS[number];
export type Intent = { id:string; workId:string; action:Action; milestoneId:string|null; evidenceHash:string|null; source:string; status:string; createdAt:number; expiresAt:number|null; unsignedXdr:string|null; signedXdr:string|null; txHash:string|null; error:string|null; ledger:number|null };
export type OnchainWork = { payer:string; payee:string; plan_hash:string; deadline:string|number; accepted:boolean; funded:boolean; closed:boolean; cancel_requested:boolean; milestones: { amount:string; evidence:string; has_evidence:boolean; approved:boolean; paid:boolean }[] };
export function authorize(a:Actor,projectId:string,adminOnly=false) {
  check(!adminOnly||a.role==='admin','FORBIDDEN','Human/admin route required',403);
  check(a.role==='admin'||a.projects.includes(projectId),'FORBIDDEN','Project is outside token scope',403);
}
export function parseProject(v:unknown):Project {
  const p=fields(v,['id','name','payer','payee','tokenContract','tokenLabel','decimals']);
  const t=text(p.tokenContract,'tokenContract',56);check(/^C[A-Z2-7]{55}$/.test(t),'ADDRESS','Expected C token contract');
  const payer=publicAddress(p.payer),payee=publicAddress(p.payee);check(payer!==payee,'PARTIES','Use distinct parties');
  return {id:id(p.id),name:text(p.name,'name',120),payer,payee,tokenContract:t,tokenLabel:text(p.tokenLabel,'tokenLabel',32),decimals:integer(p.decimals,'decimals',0,18)};
}
export function parsePlan(v:unknown,now:number):Plan {
  const p=fields(v,['title','description','deadline','totalUnits','milestones']);
  const deadline=integer(p.deadline,'deadline');check(deadline>now && deadline<=now+366*86400,'DEADLINE','Deadline must be in the future and within one year');
  check(Array.isArray(p.milestones)&&p.milestones.length>=1&&p.milestones.length<=10,'VALIDATION','Use 1–10 milestones');
  const seen=new Set<string>();
  const milestones:Milestone[]=p.milestones.map(raw=>{
    const m=fields(raw,['id','title','amountUnits','criteria','dependsOn']);const mid=id(m.id);
    check(!seen.has(mid),'DUPLICATE','Duplicate milestone ID');
    check(Array.isArray(m.criteria)&&m.criteria.length>=1&&m.criteria.length<=12,'VALIDATION','Use 1–12 criteria per milestone');
    const cs=new Set<string>();
    const criteria=m.criteria.map(rawC=>{const c=fields(rawC,['id','text','evidence']);const cid=id(c.id);check(!cs.has(cid),'DUPLICATE','Duplicate criterion');cs.add(cid);check(c.evidence==='self_reported'||c.evidence==='trusted_ci','VALIDATION','Unknown evidence class');return {id:cid,text:text(c.text,'criterion',1000),evidence:c.evidence} as Criterion;});
    check(Array.isArray(m.dependsOn),'VALIDATION','dependsOn must be an array');
    const dependsOn=m.dependsOn.map(id);check(new Set(dependsOn).size===dependsOn.length,'DUPLICATE','Duplicate dependency');
    check(dependsOn.every(x=>seen.has(x)),'DEPENDENCIES','Dependencies must reference earlier milestones, no cycles');
    seen.add(mid);return {id:mid,title:text(m.title,'milestone title',160),amountUnits:units(m.amountUnits).toString(),criteria,dependsOn};
  });
  const totalUnits=units(p.totalUnits).toString();check(sumUnits(milestones.map(m=>m.amountUnits))===totalUnits,'BUDGET','Milestone amounts must exactly equal total');
  return {title:text(p.title,'title',160),description:text(p.description,'description',8000),deadline,totalUnits,milestones};
}
export function commitment(work:Work,project:Project,contractId:string) {
  return digest({schema:'hito.agreement.v1',network:NETWORK,contractId,workId:work.id,projectId:project.id,payer:project.payer,payee:project.payee,tokenContract:project.tokenContract,decimals:project.decimals,plan:work.plan});
}
export function parseDelivery(v:unknown,work:Work,now:number):Omit<Delivery,'id'|'evidenceHash'> {
  check(work.state==='SEALED','STATE','Seal the agreement before recording evidence',409);
  const p=fields(v,['milestoneId','artifactHash','reference','checks']);const milestoneId=id(p.milestoneId);
  const m=work.plan.milestones.find(x=>x.id===milestoneId);check(m,'NOT_FOUND','Milestone not found',404);
  check(Array.isArray(p.checks)&&p.checks.length===m.criteria.length,'COVERAGE','Supply exactly one result per criterion');
  const seen=new Set<string>();const checks=p.checks.map(raw=>{const c=fields(raw,['criterionId','status','detail']);const cid=id(c.criterionId);check(m.criteria.some(x=>x.id===cid)&&!seen.has(cid),'COVERAGE','Unknown or duplicate criterion');seen.add(cid);check(['PASS','FAIL','NOT_CHECKED'].includes(String(c.status)),'VALIDATION','Invalid result');return {criterionId:cid,status:c.status,detail:text(c.detail,'detail',1500)} as CheckResult;}).sort((a,b)=>a.criterionId.localeCompare(b.criterionId));
  return {workId:work.id,milestoneId,planHash:work.planHash!,artifactHash:hash(p.artifactHash),reference:link(p.reference),checks,provenance:'self_reported',createdAt:now};
}
export function readiness(work:Work,milestoneId:string,d:Delivery|null) {
  const m=work.plan.milestones.find(x=>x.id===milestoneId);check(m,'NOT_FOUND','Milestone not found',404);
  const blockers:string[]=[];
  if(work.state!=='SEALED') blockers.push('AGREEMENT_NOT_SEALED');
  if(!d) blockers.push('NO_DELIVERY');
  if(d && d.planHash!==work.planHash) blockers.push('STALE_PLAN');
  if(d) for(const c of m.criteria) {
    const r=d.checks.find(x=>x.criterionId===c.id);
    if(!r||r.status!=='PASS') blockers.push(`${c.id}:${r?.status??'MISSING'}`);
    if(c.evidence==='trusted_ci'&&d.provenance!=='trusted_ci') blockers.push(`${c.id}:TRUSTED_CI_NOT_AVAILABLE`);
  }
  return {readyForHumanReview:blockers.length===0,blockers,automaticallyAccepted:false,independentVerification:d?.provenance==='trusted_ci',delivery:d};
}
