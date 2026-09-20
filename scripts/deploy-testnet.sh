#!/usr/bin/env bash
set -euo pipefail
: "${HITO_TOKEN_CONTRACT_ID:?Set a verified TESTNET SAC contract ID}"
: "${HITO_DEPLOYER:?Set the name of your dedicated TESTNET Stellar CLI identity}"
: "${HITO_ALLOW_TESTNET_DEPLOY:?Set HITO_ALLOW_TESTNET_DEPLOY=yes after reviewing the contract and test results}"
[[ "$HITO_ALLOW_TESTNET_DEPLOY" == yes ]] || exit 1
if [ -d "/tmp/hito-rustup-isolated-20260920/cargo/bin" ] && [ -z "${CARGO_HOME:-}" ]; then
  export RUSTUP_HOME="/tmp/hito-rustup-isolated-20260920/rustup"
  export CARGO_HOME="/tmp/hito-rustup-isolated-20260920/cargo"
  export PATH="/tmp/hito-rustup-isolated-20260920/cargo/bin:$PATH"
fi
cargo test --locked --manifest-path contracts/Cargo.toml
cargo build --locked --manifest-path contracts/Cargo.toml --target wasm32v1-none --release
mkdir -p reports/testnet
if command -v stellar >/dev/null 2>&1; then
  stellar contract deploy --wasm contracts/target/wasm32v1-none/release/hito_escrow.wasm --source-account "$HITO_DEPLOYER" --network testnet -- --token "$HITO_TOKEN_CONTRACT_ID" | tee reports/testnet/contract-id.txt
else
  echo "[deploy] stellar CLI not found in PATH, using node scripts/deploy-testnet.mjs..."
  node scripts/deploy-testnet.mjs | tee reports/testnet/contract-id.txt
fi
printf '\nRecord contract ID, WASM SHA-256, CLI version, asset provenance and new Testnet project in docs/TESTNET_RUNBOOK.md.\n'
