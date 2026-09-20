import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import * as S from '@stellar/stellar-sdk';

const tokenContract = process.env.HITO_TOKEN_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const rpcUrl = process.env.HITO_RPC_URL || 'https://soroban-testnet.stellar.org';
const server = new S.rpc.Server(rpcUrl);

async function main() {
  console.log('[deploy] Checking network...');
  const net = await server.getNetwork();
  if (net.passphrase !== S.Networks.TESTNET) {
    throw new Error('RPC is not Stellar Testnet');
  }

  let kp;
  if (process.env.HITO_DEPLOYER_SECRET) {
    kp = S.Keypair.fromSecret(process.env.HITO_DEPLOYER_SECRET);
    console.log('[deploy] Using deployer public key:', kp.publicKey());
  } else {
    kp = S.Keypair.random();
    console.log('[deploy] Generated ephemeral deployer key:', kp.publicKey());
    console.log('[deploy] Requesting Testnet Friendbot funding...');
    const fRes = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
    if (!fRes.ok) throw new Error(`Friendbot failed with status ${fRes.status}`);
  }

  let acc = await server.getAccount(kp.publicKey());
  const wasmPath = 'contracts/target/wasm32v1-none/release/hito_escrow.wasm';
  const wasm = readFileSync(wasmPath);
  const wasmHash = S.hash(wasm);
  console.log('[deploy] WASM hash:', wasmHash.toString('hex'));

  console.log('[deploy] Uploading contract WASM...');
  const uploadOp = S.Operation.uploadContractWasm({ wasm });
  const tx1 = new S.TransactionBuilder(acc, { fee: '100000', networkPassphrase: S.Networks.TESTNET })
    .addOperation(uploadOp)
    .setTimeout(180)
    .build();

  const sim1 = await server.simulateTransaction(tx1);
  if (S.rpc.Api.isSimulationError(sim1)) {
    throw new Error(`Simulation error during upload: ${JSON.stringify(sim1.error)}`);
  }
  const assembled1 = S.rpc.assembleTransaction(tx1, sim1).build();
  assembled1.sign(kp);
  const r1 = await server.sendTransaction(assembled1);
  console.log('[deploy] Upload tx submitted:', r1.hash, 'status:', r1.status);

  let res1 = await server.getTransaction(r1.hash);
  while (res1.status === S.rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise(r => setTimeout(r, 1000));
    res1 = await server.getTransaction(r1.hash);
  }
  if (res1.status !== S.rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Upload transaction failed on ledger: ${JSON.stringify(res1)}`);
  }
  console.log('[deploy] WASM uploaded successfully.');

  console.log('[deploy] Creating contract instance with token SAC:', tokenContract);
  acc = await server.getAccount(kp.publicKey());
  const constructorArgs = [new S.Address(tokenContract).toScVal()];
  const createOp = S.Operation.createCustomContract({
    address: new S.Address(kp.publicKey()),
    wasmHash,
    constructorArgs
  });
  const tx2 = new S.TransactionBuilder(acc, { fee: '100000', networkPassphrase: S.Networks.TESTNET })
    .addOperation(createOp)
    .setTimeout(180)
    .build();

  const sim2 = await server.simulateTransaction(tx2);
  if (S.rpc.Api.isSimulationError(sim2)) {
    throw new Error(`Simulation error during contract creation: ${JSON.stringify(sim2.error)}`);
  }
  const assembled2 = S.rpc.assembleTransaction(tx2, sim2).build();
  assembled2.sign(kp);
  const r2 = await server.sendTransaction(assembled2);
  console.log('[deploy] Create contract tx submitted:', r2.hash, 'status:', r2.status);

  let res2 = await server.getTransaction(r2.hash);
  while (res2.status === S.rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise(r => setTimeout(r, 1000));
    res2 = await server.getTransaction(r2.hash);
  }
  if (res2.status !== S.rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Create contract transaction failed on ledger: ${JSON.stringify(res2)}`);
  }

  const contractId = S.Address.fromScVal(res2.returnValue).toString();
  console.log('[deploy] Successfully deployed HitoEscrow contract ID:', contractId);
  mkdirSync('reports/testnet', { recursive: true });
  writeFileSync('reports/testnet/contract-id.txt', contractId + '\n');
  return contractId;
}

main().catch(e => {
  console.error('[deploy] Failed:', e);
  process.exit(1);
});
