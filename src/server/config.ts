import { check } from '../domain/errors.ts';
export type Config={adminToken:string;agentToken:string;agentProjects:string[];db:string;port:number;origin:string;mode:'local'|'testnet';contractId:string;rpcUrl:string};
export function config(env:NodeJS.ProcessEnv=process.env):Config {
  const adminToken=env.HITO_ADMIN_TOKEN??'',agentToken=env.HITO_AGENT_TOKEN??'';
  check(/^[a-f0-9]{64}$/.test(adminToken)&&/^[a-f0-9]{64}$/.test(agentToken)&&adminToken!==agentToken,'CONFIG','Run npm run setup to generate separate 256-bit local tokens');
  const port=Number(env.HITO_PORT??8787);check(Number.isInteger(port)&&port>1023&&port<65536,'CONFIG','Invalid port');
  const origin=env.HITO_ORIGIN??`http://127.0.0.1:${port}`;
  check(origin===`http://127.0.0.1:${port}`,'CONFIG','This MVP binds to loopback only; do not expose it to the Internet');
  const mode=env.HITO_MODE??'local';check(mode==='local'||mode==='testnet','NETWORK','Only local or Testnet modes are allowed');
  const contractId=env.HITO_CONTRACT_ID||'UNCONFIGURED_TESTNET_CONTRACT';
  if(mode==='testnet')check(/^C[A-Z2-7]{55}$/.test(contractId),'CONFIG','Configure a Testnet contract ID');
  return {adminToken,agentToken,agentProjects:(env.HITO_AGENT_PROJECTS??'demo').split(',').filter(Boolean),db:env.HITO_DB??'.hito/hito.db',port,origin,mode,contractId,rpcUrl:env.HITO_RPC_URL??'https://soroban-testnet.stellar.org'};
}
