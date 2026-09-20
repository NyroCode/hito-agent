# Tasks: Hito agent-native

Convención: `[x]` implica trabajo fuente comprobado dentro del alcance señalado; `[ ]` requiere ejecución/cierre local. No interpretar «fuente escrita» como integración validada. `[P]` permite paralelismo solo si no se editan los mismos archivos.

## Fase 1 — Canon y contratos
- [x] T001 Definir constitución y scope herramienta/no LLM en `.specify/memory/constitution.md`.
- [x] T002 [US1] Definir escenarios/FR y aceptación en `spec.md`.
- [x] T003 [US1] Modelar presupuesto y estados en `src/domain/model.ts`, `data-model.md`.
- [x] T004 Escribir REST/MCP/ABI en `contracts/` de esta spec.
- [x] T005 Revisar fuentes oficiales y separar hipótesis en `docs/SOURCES.md`.

## Fase 2 — Núcleo local
- [x] T010 [US1] Tests de entradas, dependencias, cantidades, scopes y versión en `tests/core/domain.test.ts`.
- [x] T011 [US1] Implementar SQLite/idempotencia en `src/storage/database.ts`.
- [x] T012 [US1] Borrador/sellado/commitment en `src/service/work-service.ts`.
- [x] T013 [US2] Evidencia self_reported y readiness conservador en `src/domain/model.ts`.
- [x] T014 [US2] Progress recuperable y HTTP real en `src/server/app.ts` y `tests/core/http.test.ts`.
- [x] T015 [US3] Intent/locks/reconciliación con FakeChain explícito en `tests/core/payments.test.ts`.
- [x] T016 Host/Origin/token/payload y API en `src/server/`.
- [x] T017 Corregir regresión retry después de deadline; preservar respuesta durable.
- [x] T018 CLI y setup sin seeds; verificación sintáctica y smoke local.

## Fase 3 — Dependencias y herramientas de agente
- [x] T020 [P] Revisar/resolver pins y generar `package-lock.json`; registrar `docs/DEPENDENCIES.md`.
- [x] T021 [P] `npm run check:types`; corregir tipos/API en `src/stellar`, `src/mcp`, `src/wallet` contra libs instaladas.
- [x] T022 [US1] Ejecutar `tests/adapters/mcp.test.ts`, ampliar save/delivery/idempotencia real del transporte.
- [x] T023 [US1] Configurar cliente mediante `scripts/configure-agent.mjs`, verificar siete herramientas y scope limitado.
- [x] T024 [US2] Probar skill explícita `.agents/skills/hito` sin nuevas reglas globales/autoloops.
- [x] T025 Converge de US1/US2 con transcript sanitizado, no mensaje sintético de agente.

## Fase 4 — Contrato y SDK
- [x] T030 [P] Instalar/verificar toolchain Rust aislada y generar `contracts/Cargo.lock`; Stellar CLI sigue pendiente para deploy.
- [x] T031 [US3] fmt/clippy/test/build de `contracts/hito-escrow` (31 tests ejecutados).
- [x] T032 [US3] Ampliar auth negativos mediante auth tree de rol exacto; no solo mocks globales.
- [x] T033 [US3] Probar dos works y balances/rollback, edge cases de cero/suma/fechas/dependencias.
- [x] T034 [US4] Validar cancelación/expiry/protección de entregas, TTL y restauración.
- [x] T035 [US3] Ejecutar `tests/adapters/stellar-sdk.test.ts` y pruebas de firma/cuerpo/red con SDK real y RPC tipado simulado.
- [x] T036 [US3] Revisar conversión contractArguments/ABI y native ScVal con SDK instalado.

## Fase 5 — Wallet y recuperación
- [x] T040 [P] Build de wallet y navegador Chromium real: `src/wallet/entry.ts`, `public/`.
- [x] T041 [US3] Denegación, wallet/red equivocada y firma/cuerpo alterado (transporte wallet simulado + crypto SDK real; extensión pendiente).
- [x] T042 [US4] Implementar recuperación segura READY/PREPARING, timebounds y estados de crash; no borrar lock manualmente.
- [x] T043 [US4] Test carrera de reconcile/submit/rebuild y crash-before/after-broadcast.
- [x] T044 [US2] Browser E2E desktop/móvil, evidencia declarada visible y ausencia de XSS/token storage.

## Fase 6 — Testnet
- [ ] T050 Verificar token/issuer/decimals, fondos Testnet y wallets por humano.
- [ ] T051 Publicar WASM solo con permiso, registrar digest y contractID.
- [ ] T052 [US3] Recorrido create→accept→fund→submit→approve→release y balances reales.
- [ ] T053 [US3] Segundo release rechazado sin segunda transferencia; evidencia/hash incorrecto rechazado.
- [ ] T054 [US4] Works separados para cancel y expiry; no generar recibos ficticios.
- [ ] T055 Guardar receipts, readback y logs en `reports/local-*`.

## Fase 7 — Empaque y concurso
- [x] T060 Reglamento primario, reutilización y fechas confirmados; elegibilidad/inscripción personal pendiente del usuario.
- [x] T061 Fresh install con locks, npm ci y cargo --locked; pipeline local reproducible.
- [ ] T062 Revisión externa/independiente de seguridad para dinero real (fuera de demo Testnet).
- [ ] T063 Video del agente y transacción real; no simulaciones presentadas como reales.
- [x] T064 Actualizar README/estado y ZIP sin secretos/DB/node_modules/target.

## No empezar antes del MVP

x402/servicio pagado, trusted_ci, cloud/OAuth/tenants, integración Linear y planificación gratuita deben ir en nuevas specs con valor y aceptación concretos. No usarlos para posponer T020–T055.
