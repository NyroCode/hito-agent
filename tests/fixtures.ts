import { Database } from '../src/storage/database.ts';
import { WorkService } from '../src/service/work-service.ts';
import { PaymentService } from '../src/service/payment-service.ts';
import { check } from '../src/domain/errors.ts';
import type { Actor,Intent } from '../src/domain/model.ts';
import type { ChainPort,ChainResult } from '../src/stellar/port.ts';
export const admin:Actor={id:'admin',role:'admin',projects:[]};
export const agent:Actor={id:'agent',role:'agent',projects:['demo']};
export const project={id:'demo',name:'Synthetic local fixture',payer:'G'+'A'.repeat(55),payee:'G'+'B'.repeat(55),tokenContract:'C'+'A'.repeat(55),tokenLabel:'TEST TOKEN',decimals:7};
export const NOW=1800000000;
export function plan(){return {title:'Import without duplicates',description:'Synthetic task for automated tests only',deadline:NOW+1000,totalUnits:'100000000',milestones:[{id:'one',title:'Safe import',amountUnits:'40000000',criteria:[{id:'dedupe',text:'Two imports produce one record',evidence:'self_reported'}],dependsOn:[]},{id:'two',title:'Roles',amountUnits:'60000000',criteria:[{id:'roles',text:'Unauthorized user cannot import',evidence:'self_reported'}],dependsOn:['one']}]};}
export function delivery(status='PASS'){return {milestoneId:'one',artifactHash:'ab'.repeat(32),reference:'https://example.invalid/release/one',checks:[{criterionId:'dedupe',status,detail:'Synthetic test evidence; not an actual external run'}]};}
export function fixture(path=':memory:') {const db=new Database(path);const svc=new WorkService(db,'UNCONFIGURED_TESTNET_CONTRACT',()=>NOW);svc.createProject(admin,project,'project');const w=svc.save(agent,'demo',{plan:plan()},'save');return {db,svc,w};}
export function sealed(){const f=fixture();const w=f.svc.seal(admin,f.w.id,{expectedVersion:1},'seal');return {...f,w};}
export class FakeChain implements ChainPort {
  sends=0;builds=0;timeout=false;result:ChainResult={status:'UNKNOWN'};
  async prepare(){this.builds++;return {unsignedXdr:'FAKE_UNSIGNED',txHash:this.builds.toString(16).padStart(64,'0'),expiresAt:NOW+180};}
  async validateSigned(i:Intent,xdr:string){check(xdr==='FAKE_SIGNED','SIGNATURE','Invalid fake signature',403);return xdr;}
  async broadcast(){this.sends++;if(this.timeout)throw new Error('synthetic network timeout');return {status:'SUBMITTED'} as ChainResult;}
  async lookup(){return this.result;}
  async read():Promise<never>{throw new Error('Fake has no chain state');}
}
export function payments(){const f=sealed();const chain=new FakeChain();return {...f,chain,pay:new PaymentService(f.svc,chain)};}
