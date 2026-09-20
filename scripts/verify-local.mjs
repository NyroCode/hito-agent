import { mkdirSync,writeFileSync,readdirSync } from 'node:fs';import { spawnSync } from 'node:child_process';
const dir=`reports/local-${new Date().toISOString().replace(/[:.]/g,'-')}`;mkdirSync(dir,{recursive:true});
const tasks=[['syntax',['scripts/check-syntax.mjs']],['core',['--experimental-strip-types','--test',...readdirSync('tests/core').filter(x=>x.endsWith('.test.ts')).map(x=>'tests/core/'+x)]]];
const result={generatedAt:new Date().toISOString(),node:process.version,tests:[],notRun:['TypeScript type check','SDK adapters','MCP transport','Rust compilation and tests','Wallet extension signing','Live Testnet','x402']};
for(const [name,args]of tasks){const r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:60000});writeFileSync(`${dir}/${name}.log`,(r.stdout??'')+(r.stderr??''));result.tests.push({name,exitCode:r.status,error:r.error?.message??null});}
writeFileSync(`${dir}/summary.json`,JSON.stringify(result,null,2)+'\n');console.log(dir);if(result.tests.some(x=>x.exitCode!==0))process.exit(1);
