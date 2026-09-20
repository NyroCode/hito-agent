import { createServer } from 'node:http';
import type { IncomingMessage,ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { asError,check,HitoError } from '../domain/errors.ts';
import { fields,id,secretEquals,text } from '../domain/primitives.ts';
import type { Actor,Work } from '../domain/model.ts';
import type { Config } from './config.ts';
import { WorkService } from '../service/work-service.ts';
import { PaymentService } from '../service/payment-service.ts';
const PUBLIC=fileURLToPath(new URL('../../public/',import.meta.url));
async function readBody(req:IncomingMessage){
  check((req.headers['content-type']??'').split(';')[0]==='application/json','CONTENT_TYPE','Use application/json',415);
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){size+=chunk.length;check(size<=256_000,'TOO_LARGE','Request too large',413);chunks.push(Buffer.from(chunk));}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HitoError('JSON','Invalid JSON');}
}
function respond(res:ServerResponse,status:number,body:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
export function application(c:Config,work:WorkService,pay:PaymentService){
  const buckets=new Map<string,{time:number;n:number}>();
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try{
      check(req.headers.host===new URL(c.origin).host,'HOST','Host header not allowed',403);
      check(!req.headers.origin||req.headers.origin===c.origin,'ORIGIN','Cross-origin requests forbidden',403);
      const now=Date.now(),ip=req.socket.remoteAddress??'unknown';let b=buckets.get(ip);if(!b||now-b.time>60000){b={time:now,n:0};buckets.set(ip,b);}check(++b.n<=300,'RATE_LIMIT','Too many requests',429);
      const u=new URL(req.url??'/',c.origin);const path=u.pathname;const method=req.method??'GET';
      if(path==='/healthz'&&method==='GET'){respond(res,200,{ok:true,mode:c.mode,network:'TESTNET_ONLY',paymentsSimulated:false});return;}
      if(!path.startsWith('/api/')){
        const allowed:Record<string,[string,string]>={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/styles.css':['styles.css','text/css'],'/wallet.bundle.js':['wallet.bundle.js','text/javascript']};
        check(method==='GET'&&allowed[path],'NOT_FOUND','Not found',404);const [name,type]=allowed[path];let data:Buffer;try{data=await readFile(join(PUBLIC,name));}catch{throw new HitoError('BUILD_REQUIRED','Wallet bundle unavailable; run npm install and npm run build:wallet',404);}
        res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});res.end(data);return;
      }
      const bearer=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):'';
      let a:Actor;if(bearer&&secretEquals(bearer,c.adminToken))a={id:'local-admin',role:'admin',projects:[]};else if(bearer&&secretEquals(bearer,c.agentToken))a={id:'local-agent',role:'agent',projects:c.agentProjects};else throw new HitoError('UNAUTHORIZED','Valid Bearer token required',401);
      const key=()=>text(req.headers['idempotency-key'],'Idempotency-Key',120);
      const parts=path.slice(5).split('/').filter(Boolean).map(decodeURIComponent);let result:unknown;
      if(path==='/api/info'&&method==='GET')result={role:a.role,mode:c.mode,network:'TESTNET',contractId:c.contractId,agentScopedProjects:a.projects,version:'0.1.0',embeddedLLM:false};
      else if(path==='/api/projects'&&method==='GET')result=work.projects(a);
      else if(path==='/api/projects'&&method==='POST')result=work.createProject(a,await readBody(req),key());
      else if(parts[0]==='projects'&&parts[2]==='works'&&parts.length===3){const pid=id(parts[1]);work.project(a,pid);if(method==='GET')result=work.store.list<Work>('work',pid);else if(method==='POST')result=work.save(a,pid,await readBody(req),key());else throw new HitoError('METHOD','Unsupported method',405);}
      else if(parts[0]==='works'&&parts.length>=2){
        const wid=id(parts[1]);const w=work.work(a,wid);const sub=parts[2];check(parts.length<=3,'NOT_FOUND','Not found',404);
        if(!sub&&method==='GET')result={work:w,project:work.project(a,w.projectId),deliveries:work.deliveries(a,wid),progress:work.progressStates(a,wid),intents:work.intents(a,wid)};
        else if(sub==='seal'&&method==='POST')result=work.seal(a,wid,await readBody(req),key());
        else if(sub==='deliveries'&&method==='POST')result=work.deliver(a,wid,await readBody(req),key());
        else if(sub==='progress'&&method==='POST')result=work.progress(a,wid,await readBody(req),key());
        else if(sub==='readiness'&&method==='GET')result=work.readiness(a,wid,id(u.searchParams.get('milestoneId')));
        else if(sub==='intents'&&method==='POST')result=work.prepare(a,wid,await readBody(req),key());
        else if(sub==='intents'&&method==='GET')result=work.intents(a,wid);
        else if(sub==='chain'&&method==='GET')result=await pay.state(a,wid);
        else throw new HitoError('NOT_FOUND','Route not found',404);
      }
      else if(parts[0]==='intents'&&parts.length>=2){const iid=id(parts[1]);check(parts.length<=3,'NOT_FOUND','Not found',404);const sub=parts[2];
        if(!sub&&method==='GET')result=work.publicIntent(work.intent(a,iid));
        else if(sub==='build'&&method==='POST'){fields(await readBody(req),[]);result=await pay.build(a,iid);}
        else if(sub==='submit'&&method==='POST'){const b=fields(await readBody(req),['signedXdr']);result=await pay.submit(a,iid,text(b.signedXdr,'signedXdr',100000));}
        else if(sub==='reconcile'&&method==='POST'){fields(await readBody(req),[]);result=await pay.reconcile(a,iid);}
        else throw new HitoError('NOT_FOUND','Route not found',404);
      }else throw new HitoError('NOT_FOUND','Route not found',404);
      respond(res,200,result);
    }catch(e){const err=asError(e);if(err.status===500)console.error('[hito] internal error type:',e instanceof Error?e.name:'unknown');if(!res.headersSent)respond(res,err.status,{error:{code:err.code,message:err.message}});else res.end();}
  });
}
