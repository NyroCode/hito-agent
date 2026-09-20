#!/usr/bin/env bash
set -euo pipefail
# Inspect and pin an official release before running. No remote script piping.
: "${SPEC_KIT_REF:?Set SPEC_KIT_REF to a reviewed official release tag or 40-character commit SHA. See docs/SPEC_KIT.md}"
[[ "$SPEC_KIT_REF" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([.-][A-Za-z0-9.-]+)?$ || "$SPEC_KIT_REF" =~ ^[0-9a-f]{40}$ ]] || { echo "Expected reviewed tag or full commit SHA" >&2; exit 1; }
AGENT="${SPEC_KIT_INTEGRATION:-codex}"
command -v uv >/dev/null || { echo 'Install uv from its official documentation first.' >&2; exit 1; }
uv tool install specify-cli --from "git+https://github.com/github/spec-kit.git@${SPEC_KIT_REF}"
specify version
STAGING=$(mktemp -d)
specify init "$STAGING/hito-spec-kit" --integration "$AGENT" --ignore-agent-tools --non-interactive --script sh
printf '
Spec Kit initialized in: %s/hito-spec-kit
' "$STAGING"
printf 'Review the generated integration and selectively merge it. Preserve .specify/memory/constitution.md and specs/001-hito-agent-native/. No in-place force initialization was performed.
'
