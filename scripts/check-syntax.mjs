import { readdirSync,statSync } from 'node:fs';import { join } from 'node:path';import { spawnSync } from 'node:child_process';
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?walk(p):[p];});}
const files=['src','tests','scripts','public'].flatMap(walk).filter(p=>/\.(ts|mjs|js)$/.test(p)&&!p.endsWith('.d.ts')&&!p.endsWith('.bundle.js'));
let failures=0;for(const file of files){const r=spawnSync(process.execPath,['--experimental-strip-types','--check',file],{encoding:'utf8'});if(r.status!==0){console.error(file,r.stderr);failures++;}}
console.log(JSON.stringify({syntaxFiles:files.length,failures,notTypechecking:true}));if(failures)process.exit(1);
