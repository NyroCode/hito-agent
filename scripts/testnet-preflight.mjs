const required=['HITO_CONTRACT_ID','HITO_TOKEN_CONTRACT_ID','HITO_PAYER_ADDRESS','HITO_PAYEE_ADDRESS'];
for(const k of required)if(!process.env[k])throw new Error(`Missing ${k}. Public IDs only; never provide a seed.`);
const url='https://soroban-testnet.stellar.org';
const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getNetwork'}),signal:AbortSignal.timeout(15000)});
const j=await r.json();if(!r.ok||j.result?.passphrase!=='Test SDF Network ; September 2015')throw new Error('Not a verified Testnet RPC');
console.log(JSON.stringify({network:'TESTNET',protocolVersion:j.result.protocolVersion,contractId:process.env.HITO_CONTRACT_ID,asset:process.env.HITO_TOKEN_CONTRACT_ID,notYetVerified:['contract code hash','asset issuer/decimals','wallet ownership','trustlines','balances']},null,2));
