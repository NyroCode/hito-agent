# Implementation Plan: Hito agent-native

## Summary
Construir una herramienta MCP sobre un servicio determinista local. El agente existente produce el plan y ejecuta sus tareas. Una UI humana registra la configuración, sella el acuerdo y solicita firma Freighter. SQLite mantiene el trabajo; Soroban mantiene el estado económico autorizado.

## Technical Context

Language: TypeScript ESM/Node 22 y Rust. Storage: SQLite/WAL local. Client: stdio MCP, CLI y UI sin framework. Chain: Soroban + token compatible SAC/SEP-41 en Stellar Testnet. External dependencies: SDK MCP v1, SDK Stellar, Freighter, Zod, esbuild; versiones candidatas fijadas y verificaciones pendientes en `docs/DEPENDENCIES.md`. No LLM API, Next.js, Redis ni proveedor de base remoto obligatorio.

## Constitution Check

Herramienta/no agente: PASS por diseño. Separación de firma: local tests PASS; SDK/wallet pendiente. Evidencia honesta: local PASS. Reproducibilidad: core PASS, dependencias externas bloqueadas. Stellar real: NOT_RUN. No declarar producto Converged hasta resolver todos los gates P0.

## Phase 0 — Investigación y decisiones

Revisados el repositorio y templates oficiales de Spec Kit; documentación de autorización, RPC, almacenamiento, wallets y tooling de Stellar; tutorial MCP y fuente SDK v1. Fuentes en `research.md` y `docs/SOURCES.md`. Las decisiones propias se distinguen de hechos del fabricante. Ningún instalador remoto fue ejecutado.

## Phase 1 — Contratos de dominio e interfaces

Primero schemas, presupuesto exacto, scoping, versiones, compromisos, cobertura y errores. Después almacenamiento e idempotencia. Interface económica `ChainPort` separa fake exclusivamente en tests, offline explícito y adaptador real. REST y MCP comparten WorkService. Herramientas no aceptan addresses ni XDR arbitrario.

## Phase 2 — Vertical slice local

Configurar tokens distintos, localhost, SQLite y UI. Crear proyecto y borrador; sellar; registrar FAIL/NOT_CHECKED/PASS; consultar readiness; preparar intent sin pagar. Persistencia, scopes y reintentos reales sobre HTTP se verifican antes de conectar red.

## Phase 3 — SDK y protocolo

Resolver versiones y crear lock. Ejecutar tsc; adaptar solo contra documentación/typings oficiales instalados. Probar stdio handshake y siete tools con backend real. Construir bundle Freighter. Confirmar no tokens de admin ni datos de wallet en la configuración MCP. Activar un único cliente de agente antes de multiplicar integraciones.

## Phase 4 — Soroban

Compilar y ejecutar pruebas antes de deploy. Revisar auth trees sin depender solamente de mock_all_auths. Probar eventos, rollback, suma/balances, TTL/restoration y replay. Activo inmutable y fondos de cada Work lógicamente aislados en storage. Revisar posibles interacciones entre varios works en un contrato.

## Phase 5 — Firma y Testnet

Crear nueva configuración (no usar demo sintética). Verificar issuer, token contract, decimals, red, ownership de wallets y WASM. Cumplir runbook exacto; dos roles firman su parte. Guardar recibos originales y comparar saldo/estado. Probar un rechazo y una confirmación. No gastar activos Mainnet.

## Phase 6 — Cierre

Resolver recuperación de intents caducados/signer locks, hacer revisión adversarial, navegador y arranque limpio desde ZIP. Documentar originalidad/reutilización para el concurso solo con bases primarias. Grabar demo del agente usando herramientas, no una animación que simula pagos.

## Estructura

`src/domain` → `src/storage` → `src/service` → `src/server` → CLI/MCP/UI. `PaymentService` → `ChainPort` → adaptador RPC. Wallet solo cliente; contrato Rust independiente. `specs/001-hito-agent-native/contracts/` describe REST/MCP/ABI.

## Dependencias de trabajo y paralelismo

A: dominio/API; B: Rust; C: SDK/wallet; D: docs/MCP pueden revisarse en paralelo una vez congelados los contratos. Un integrador resuelve cambios y ejecuta toda la suite. No dos subagentes modificando los mismos schemas o Cargo manifest sin coordinar. Tests de aceptación comunes no se cambian unilateralmente.

## Complexity Tracking

SQLite y Node nativo permiten ejecutar el core sin red. No deben confundirse con arquitectura SaaS final. Contrato propio pequeño justifica control de hashes/auth; no demuestra originalidad por sí mismo. x402 solo después de flujo principal real y una necesidad pagada auténtica.
