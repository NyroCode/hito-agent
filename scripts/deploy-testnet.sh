#!/usr/bin/env bash
set -euo pipefail
: "${HITO_TOKEN_CONTRACT_ID:?Set a verified TESTNET SAC contract ID}"
: "${HITO_DEPLOYER:?Set the name of your dedicated TESTNET Stellar CLI identity}"
: "${HITO_ALLOW_TESTNET_DEPLOY:?Set HITO_ALLOW_TESTNET_DEPLOY=yes after reviewing the contract and test results}"
[[ "$HITO_ALLOW_TESTNET_DEPLOY" == yes ]] || exit 1
command -v stellar >/dev/null
cargo test --manifest-path contracts/Cargo.toml
cargo build --manifest-path contracts/Cargo.toml --target wasm32v1-none --release
mkdir -p reports/testnet
# Review stellar contract deploy --help against your installed CLI before using this command.
stellar contract deploy --wasm contracts/target/wasm32v1-none/release/hito_escrow.wasm --source-account "$HITO_DEPLOYER" --network testnet -- --token "$HITO_TOKEN_CONTRACT_ID" | tee reports/testnet/contract-id.txt
printf '
Record contract ID, WASM SHA-256, CLI version, asset provenance and new Testnet project in docs/TESTNET_RUNBOOK.md.
'
