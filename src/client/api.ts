import { check,HitoError } from '../domain/errors.ts';
export function apiClient(base:string,token:string){
  const u=new URL(base);check(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&!u.username&&!u.password,'CONFIG','MVP client requires loopback HTTP');
  check(token.length>=32,'CONFIG','Missing agent token');
  return async function api(path:string,body?:unknown,key?:string){
    check(path.startsWith('/api/'),'ROUTE','Invalid API path');
    const r=await fetch(new URL(path,u),{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,...(body!==undefined?{'Content-Type':'application/json','Idempotency-Key':key??''}:{})},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(25000)});
    const data=await r.json();if(!r.ok)throw new HitoError(data.error?.code??'HTTP',data.error?.message??'API error',r.status);return data;
  };
}
