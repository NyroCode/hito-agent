// Requires the actual MCP SDK; not included in the dependency-free local gate.
import test from 'node:test';import assert from 'node:assert/strict';import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { application } from '../../src/server/app.ts';import { PaymentService } from '../../src/service/payment-service.ts';import { offlineChain } from '../../src/stellar/offline.ts';import { admin,delivery,fixture,plan } from '../fixtures.ts';import type { AddressInfo } from 'node:net';
function toolJson<T>(value:unknown):T {
 const r=value as {isError?:boolean;content?:unknown};assert.notEqual(r.isError,true);const contents=r.content as {type:string;text?:string}[];assert.equal(contents[0]?.type,'text');return JSON.parse(contents[0]?.text??'null') as T;
}
test('real MCP handshake lists seven tools and calls save, delivery and payment status against the HTTP backend',async t=>{
 const f=fixture();const config={adminToken:'a'.repeat(64),agentToken:'b'.repeat(64),agentProjects:['demo'],db:':memory:',port:0,origin:'',mode:'local' as const,contractId:'UNCONFIGURED_TESTNET_CONTRACT',rpcUrl:'https://soroban-testnet.stellar.org'};
 f.svc.seal(admin,f.w.id,{expectedVersion:f.w.version},'mcp-seal');
 const http=application(config,f.svc,new PaymentService(f.svc,offlineChain()));await new Promise<void>(resolve=>http.listen(0,'127.0.0.1',resolve));config.port=(http.address() as AddressInfo).port;config.origin=`http://127.0.0.1:${config.port}`;
 const client=new Client({name:'hito-test',version:'1'});const transport=new StdioClientTransport({command:process.execPath,args:['--experimental-strip-types',fileURLToPath(new URL('../../src/mcp/main.ts',import.meta.url))],env:{PATH:process.env.PATH??'',HITO_API_URL:config.origin,HITO_AGENT_TOKEN:config.agentToken},stderr:'pipe'});
 try{
  await client.connect(transport);assert.deepEqual(client.getServerVersion(),{name:'hito',version:'0.1.0'});await client.ping();
  const list=await client.listTools();assert.deepEqual(list.tools.map(x=>x.name).sort(),['hito_check_readiness','hito_get_context','hito_get_payment_status','hito_prepare_payment','hito_save_work','hito_submit_delivery','hito_update_progress']);assert.equal(list.tools.some(x=>/sign|execute_xdr/.test(x.name)),false);
  const context=toolJson<{id:string}[]>(await client.callTool({name:'hito_get_context',arguments:{}}));assert.equal(context[0]?.id,'demo');
  const saved=toolJson<{state:string;projectId:string}>(await client.callTool({name:'hito_save_work',arguments:{projectId:'demo',plan:plan(),idempotencyKey:'mcp-save'}}));assert.equal(saved.state,'DRAFT');assert.equal(saved.projectId,'demo');
  const recorded=toolJson<{evidenceHash:string;workId:string}>(await client.callTool({name:'hito_submit_delivery',arguments:{workId:f.w.id,...delivery(),idempotencyKey:'mcp-delivery'}}));assert.equal(recorded.workId,f.w.id);assert.match(recorded.evidenceHash,/^[0-9a-f]{64}$/);
  const intent=toolJson<{id:string;status:string;requiresWalletSignature:boolean}>(await client.callTool({name:'hito_prepare_payment',arguments:{workId:f.w.id,action:'submit',milestoneId:'one',evidenceHash:recorded.evidenceHash,idempotencyKey:'mcp-intent'}}));assert.equal(intent.status,'REQUESTED');assert.equal(intent.requiresWalletSignature,true);
  const status=toolJson<{id:string;status:string;unsignedXdr?:unknown;signedXdr?:unknown}>(await client.callTool({name:'hito_get_payment_status',arguments:{intentId:intent.id}}));assert.equal(status.id,intent.id);assert.equal(status.status,'REQUESTED');assert.equal(status.unsignedXdr,undefined);assert.equal(status.signedXdr,undefined);
  t.diagnostic(JSON.stringify({server:client.getServerVersion(),tools:list.tools.map(x=>x.name).sort(),calls:{context:'PASS',save:saved.state,delivery:'RECORDED',prepare:intent.status,status:status.status},stdout:'JSON-RPC only; handshake, ping and calls parsed by SDK'}));
 }
 finally{await client.close();await new Promise<void>(resolve=>http.close(()=>resolve()));f.db.close();}
});
