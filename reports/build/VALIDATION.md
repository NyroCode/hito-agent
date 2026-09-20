# Validación efectivamente realizada

Fecha: 2026-09-20. Entorno Linux; Node v22.16.0, npm 10.9.2. Esta es evidencia del código de esta entrega, no del laboratorio anterior de Hito.

## Resultado

| Comprobación | Resultado |
|---|---|
| `npm run check` | 30 archivos JS/TS/MJS analizados sintácticamente, 0 errores. NO es tsc. |
| `npm test` | **79 pruebas locales; 79 PASS, 0 FAIL, 0 SKIP.** |
| HTTP real + SQLite + permisos | Incluidos en la suite; no se mockea la persistencia ni el servidor HTTP. |
| CLI contra backend real | Consulta de proyectos correcta; datos sintéticos explícitos. |
| `npm run setup` | Tokens locales separados creados sin sobrescribir; excluidos del ZIP. |
| `npm run configure:agent` | Configuraciones generadas; no instaladas globalmente ni incluidas con rutas del contenedor. |
| Bash scripts | `bash -n` sin errores; NO se ejecutó deploy ni instalación Spec Kit. |
| `npm install` | BLOCKED: EAI_AGAIN/DNS al registro npm; no dependencias instaladas. |
| Browser Playwright / Chromium | BLOCKED: ERR_BLOCKED_BY_ADMINISTRATOR al abrir localhost; 0 assertions E2E ejecutadas. |
| `tsc`, SDK/MCP real, wallet bundle | NOT_RUN: requieren dependencias. |
| Rust/Soroban | **22 pruebas escritas, NOT_RUN**; no cargo/rustc disponibles. No WASM. |
| Testnet / Freighter real | NOT_RUN; no contratos desplegados, firmas ni pagos de red. |
| x402 | No implementado; fuera del MVP actual. |

## Qué cubre el core

Schemas/valores, suma exacta i128, scopes, versiones, inmutabilidad, persistencia/idempotencia, entrega ligada a criterios, readiness, bloqueo de procedencia no disponible, intents, bloqueo de cuenta, firma falsa rechazada por test double, reintentos, resultados tardíos y estados RPC conservadores. FakeChain está exclusivamente en tests; no se expone como «pagos demo» en la app.

Las pruebas de signature en core prueban el flujo de control con un doble, NO criptografía real. Tests con SDK Ed25519 están escritos por separado para ejecutar después de instalar. Ninguna de las 79 pruebas es una confirmación de pago real.

## Iteraciones y correcciones

1. Primera ejecución: 72/73. El test de Host utilizaba fetch, que no aplicaba la cabecera como requería el caso. Se cambió el harness a node:http; no se retiró la defensa Host.
2. Se añadió regresión para repetir la misma petición cuando ya venció el plazo: 73/74. Reveló validación temporal previa a buscar idempotency record. Se movió esa validación dentro de la mutación inicial. Reintentos conservan la respuesta original.
3. Se corrigió una cadena de nueva línea inválida del generador de config; syntax pasó.
4. Progress quedó incorporado al contexto recuperable; añadido test HTTP.
5. Se separó resultado de sendTransaction de recibo final: ERROR/TRY_AGAIN_LATER conservan UNKNOWN. Cuatro pruebas adicionales evitan futuras falsas confirmaciones.
6. Última ejecución: 79/79 y sintaxis 30/30.

## Limitaciones que permanecen

Locks de READY/PREPARING abandonados necesitan recuperación segura (G4). No existe CI independiente, arbitraje, OAuth cloud ni aislamiento frente a un proceso local con acceso irrestricto. UI no ha pasado browser E2E. Paquetes fijados todavía deben resolverse y generar locks. No afirmar «terminado end-to-end» o «producción».

## Archivos de evidencia

`core-tests.tap`, `syntax.log`, `cli-smoke.json`, `cli-smoke.stderr.log`, `initial-test-run.tap`, `deadline-regression-failure.tap`, `dependency-install-blocked.log`, `browser-smoke.json` y `summary.json`.

Los resultados reproducidos por el agente local deben ir en reports/local-<fecha>, no reemplazar estos hechos históricos. Los timestamps de red/txhashes deben provenir de Stellar real cuando se ejecuten.
