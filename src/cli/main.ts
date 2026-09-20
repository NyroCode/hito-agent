import { readFile } from 'node:fs/promises';
import { apiClient } from '../client/api.ts';
const [command,resource,file]=process.argv.slice(2);
if(!command||command==='help'){console.log('Hito CLI: projects | context WORK | save PROJECT file.json | delivery WORK file.json | progress WORK file.json | prepare WORK file.json | status INTENT. Set HITO_API_URL and HITO_AGENT_TOKEN. No signing commands.');process.exit(0);}
const api=apiClient(process.env.HITO_API_URL??'http://127.0.0.1:8787',process.env.HITO_AGENT_TOKEN??'');
const routes:Record<string,string>={projects:'/api/projects',context:`/api/works/${resource}`,save:`/api/projects/${resource}/works`,delivery:`/api/works/${resource}/deliveries`,progress:`/api/works/${resource}/progress`,prepare:`/api/works/${resource}/intents`,status:`/api/intents/${resource}`};
if(!routes[command])throw new Error('Unknown command; use help');
let body:unknown=undefined;if(file)body=JSON.parse(await readFile(file,'utf8'));
if(['save','delivery','progress','prepare'].includes(command)&&(!file||!process.env.HITO_IDEMPOTENCY_KEY))throw new Error('Write requires a JSON file and HITO_IDEMPOTENCY_KEY');
try{console.log(JSON.stringify(await api(routes[command],body,process.env.HITO_IDEMPOTENCY_KEY),null,2));}catch(e){console.error(e instanceof Error?e.message:'Request failed');process.exitCode=1;}
