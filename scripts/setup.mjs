import { randomBytes } from 'node:crypto';import { existsSync,writeFileSync,mkdirSync } from 'node:fs';
if(existsSync('.env')||existsSync('.hito-agent.env'))throw new Error('Configuration already exists. No files overwritten.');
const admin=randomBytes(32).toString('hex'),agent=randomBytes(32).toString('hex');
mkdirSync('.hito',{recursive:true,mode:0o700});
writeFileSync('.env',`HITO_ADMIN_TOKEN=${admin}
HITO_AGENT_TOKEN=${agent}
HITO_AGENT_PROJECTS=demo
HITO_DB=.hito/hito.db
HITO_PORT=8787
HITO_ORIGIN=http://127.0.0.1:8787
HITO_MODE=local
HITO_CONTRACT_ID=
HITO_RPC_URL=https://soroban-testnet.stellar.org
`,{mode:0o600,flag:'wx'});
writeFileSync('.hito-agent.env',`HITO_API_URL=http://127.0.0.1:8787
HITO_AGENT_TOKEN=${agent}
`,{mode:0o600,flag:'wx'});
console.log('Created .env and .hito-agent.env with separate random tokens. Only the human should read HITO_ADMIN_TOKEN. No wallet keys created. Next: npm start, then npm run demo:seed in another terminal.');
