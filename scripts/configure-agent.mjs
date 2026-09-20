import { writeFileSync,mkdirSync } from 'node:fs';import { resolve } from 'node:path';
const root=resolve('.');const args=[`--env-file=${resolve('.hito-agent.env')}`,'--experimental-strip-types',resolve('src/mcp/main.ts')];
mkdirSync('config/generated',{recursive:true});
writeFileSync('config/generated/codex.toml',`# Merge manually; do not overwrite your existing config.
[mcp_servers.hito]
command = ${JSON.stringify(process.execPath)}
args = ${JSON.stringify(args)}
startup_timeout_sec = 30
tool_timeout_sec = 40
`);
writeFileSync('config/generated/cursor-or-claude.json',JSON.stringify({mcpServers:{hito:{command:process.execPath,args}}},null,2)+'\n');
console.log('Generated config examples without token values. Merge the hito entry into your client. Nothing installed globally.');
