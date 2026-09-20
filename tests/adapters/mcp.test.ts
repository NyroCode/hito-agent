// Requires the actual MCP SDK; not included in the dependency-free local gate.
import test from 'node:test';import assert from 'node:assert/strict';import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { application } from '../../src/server/app.ts';import { PaymentService } from '../../src/service/payment-service.ts';import { offlineChain } from '../../src/stellar/offline.ts';import { fixture } from '../fixtures.ts';import type { AddressInfo } from 'node:net';
test('real MCP transport lists exactly seven narrow tools and reads scoped context',async()=>{
 const f=fixture();const config={adminToken:'a'.repeat(64),agentToken:'b'.repeat(64),agentProjects:['demo'],db:':memory:',port:0,origin:'',mode:'local' as const,contractId:'UNCONFIGURED_TESTNET_CONTRACT',rpcUrl:'https://soroban-testnet.stellar.org'};
 const http=application(config,f.svc,new PaymentService(f.svc,offlineChain()));await new Promise<void>(resolve=>http.listen(0,'127.0.0.1',resolve));config.port=(http.address() as AddressInfo).port;config.origin=`http://127.0.0.1:${config.port}`;
 const client=new Client({name:'hito-test',version:'1'});const transport=new StdioClientTransport({command:process.execPath,args:['--experimental-strip-types',fileURLToPath(new URL('../../src/mcp/main.ts',import.meta.url))],env:{PATH:process.env.PATH??'',HITO_API_URL:config.origin,HITO_AGENT_TOKEN:config.agentToken},stderr:'pipe'});
 try{await client.connect(transport);const list=await client.listTools();assert.equal(list.tools.length,7);assert.equal(list.tools.some(x=>/sign|execute_xdr/.test(x.name)),false);const r=await client.callTool({name:'hito_get_context',arguments:{}});assert.notEqual(r.isError,true);const contents=r.content as {type:string;text:string}[];assert.match(contents[0].text,/demo/);}
 finally{await client.close();await new Promise<void>(resolve=>http.close(()=>resolve()));f.db.close();}
});
