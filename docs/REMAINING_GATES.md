# Gates restantes antes de la demo completa

Estado integrado al 20-sep-2026. Un gate local PASS no sustituye firma ni confirmación Testnet.

| Gate | Estado | Evidencia / trabajo restante |
|---|---|---|
| G1 · paquetes/types/locks | **PASS local** | `package-lock.json`, npm audit 0, tsc, adapters, bundle y `npm ci` desde copia limpia. |
| G2 · MCP + skill | **PARTIAL** | SDK real hizo handshake, ping, listó y llamó siete tools con transcript sanitizado; config/skill generadas. Falta fusionar la entrada en el host de agente del usuario y demostrar invocación explícita allí. |
| G3 · contrato Rust | **PASS local** | Cargo.lock, fmt, clippy `-D warnings`, 31 tests y WASM `cf6e8056…ca51`. Restoration archivada y red son gates separados. |
| G4 · wallet/recuperación | **PARTIAL** | Chromium, bundle, negativas SDK y transporte Freighter simulado pasan. PREPARING usa lease/fencing. READY+UNKNOWN conserva lock. Falta extensión Freighter real y firma humana. |
| G5 · Testnet | **BLOCKED por autorización humana** | No hay deploy, contract ID, tx hash, ledger ni balances. Requiere revisar activo/wallets y autorizar deploy/firmas Testnet. |
| G6 · copia limpia/video | **PARTIAL** | Copia limpia: npm ci/check/test/types/adapters/bundle/Chromium y cargo test/build `--locked` PASS. Video y pago autorizado requieren completar G5. |
| G7 · reglamento | **PASS documental** | Bases oficiales cotejadas: ventana, checkpoint, equipos, commit base, cuatro entregables, rúbrica y Testnet. Inscripción/elegibilidad del equipo las confirma el usuario. |
| G8 · x402 | **NOT_RUN / opcional** | Fuera del MVP aprobado; no bloquea el flujo de escrow. |
| G9 · cloud/OAuth/tenants/CI | **POSTERIOR** | Requiere otra especificación y threat model. |

## Problemas/limitaciones concretos a tratar, no esconder

- La validación actual usa Node 24.18.0; conservar el engine mínimo y repetir en el Node objetivo si la demo usa otra versión.
- `npm run check` sigue siendo solo sintaxis; el gate de tipos es `npm run check:types`.
- READY incierto por `UNKNOWN/NOT_FOUND` mantiene la fuente bloqueada; no borrar el lock para seguir la demo.
- Chromium E2E usa transporte Freighter simulado. No equivale a aprobar una solicitud en la extensión real.
- Contrato no auditado, sin arbitraje y no apto para producción. Hay auth trees exactos y negativos locales, pero no auditoría externa ni evidencia Testnet.
- No existe integración trusted_ci ni verificación automática de pruebas del repo; todos los reports locales son declarados.
- No soporte remoto multiusuario ni demostración de ownership de wallets por challenge.
- Milestones remunerados exclusivamente en v0.1. Planificación interna sin importe es una evolución, no fingir amount=0.

Ningún gate bloqueado exige descartar el proyecto: terminar lo que se pueda comprobar y entregar un informe preciso. No cambiar a otra arquitectura para evitar la prueba.
