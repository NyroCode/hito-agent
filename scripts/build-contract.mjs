import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const isolatedCargo = '/tmp/hito-rustup-isolated-20260920/cargo/bin/cargo';
const isolatedRustup = '/tmp/hito-rustup-isolated-20260920/rustup';
const isolatedCargoHome = '/tmp/hito-rustup-isolated-20260920/cargo';

const env = { ...process.env };
if (existsSync(isolatedCargo) && !env.CARGO_HOME) {
  env.RUSTUP_HOME = isolatedRustup;
  env.CARGO_HOME = isolatedCargoHome;
  env.PATH = `${isolatedCargoHome}/bin:${env.PATH || ''}`;
}

const res = spawnSync(
  'cargo',
  ['build', '--locked', '--manifest-path', 'contracts/Cargo.toml', '--target', 'wasm32v1-none', '--release'],
  { stdio: 'inherit', env }
);

if (res.status !== 0) {
  console.error('\n[hito] Contract WASM build failed.');
  console.error('[hito] Ensure Rust toolchain has the target wasm32v1-none:');
  console.error('       rustup target add wasm32v1-none\n');
}

process.exit(res.status ?? 1);
