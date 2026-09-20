# Hito · Acuerdos de trabajo para agentes

**Tu agente organiza y desarrolla. Hito conserva el acuerdo, registra la entrega y prepara el pago autorizado.**

Hito es una herramienta invocada por tu agente actual, como una herramienta de gestión de proyectos. No incluye un LLM propio, no ejecuta tu repositorio, no sustituye a los subagentes y no modifica documentación de forma autónoma.

## Estado real de esta entrega

| Componente | Estado |
|---|---|
| Dominio TypeScript, API HTTP y persistencia SQLite | Implementados; 87 pruebas core ejecutadas. |
| Interfaz web local | Chromium 151 automatizado a 1440 y 390 px; CSP/XSS/token storage y responsive comprobados. |
| CLI local | Implementada; comparte API y token limitado. |
| Servidor MCP y skill | SDK v1 instalado; handshake, siete tools y recorrido HTTP pasan. Integración dentro de un host de agente sigue manual. |
| Adaptador Stellar RPC y firma Freighter | SDK/tipado/negativas y bundle pasan; extensión y firma humana reales pendientes. |
| Contrato Soroban + 31 pruebas | fmt/clippy/tests y build WASM pasan; restauración archivada/Testnet pendientes. |
| Despliegue y transacciones Testnet | No realizados. No hay Contract ID ni recibos inventados. |
| x402, CI independiente, OAuth/cloud, integración Linear | Extensiones planificadas, no implementadas. |

Resultado histórico del ZIP: [VALIDATION](reports/build/VALIDATION.md). Resultado de integración local: `reports/local-20260920T190853Z/VALIDATION.md`. Pendientes: [REMAINING_GATES](docs/REMAINING_GATES.md).

## Inicio local, sin descargar dependencias

Requisito comprobado: Node **22.16.0**. Se utilizan `--experimental-strip-types` y `node:sqlite`; sus avisos experimentales no significan fallo. Para otros Node 22/24, ejecutar primero las pruebas. No se necesita una API de IA.

```bash
cd hito-agent-native
npm run check
npm test
npm run setup
npm start
```

En otra terminal, desde la misma carpeta:

```bash
npm run demo:seed
```

Abre `http://127.0.0.1:8787`. **Solo el humano** debe consultar `HITO_ADMIN_TOKEN` en `.env` y pegarlo en la interfaz. La UI lo mantiene en memoria y vacía el campo. No lo compartas con el agente; el agente usa `.hito-agent.env`, que contiene exclusivamente su credencial limitada.

`setup` crea tokens nuevos y no sobrescribe archivos existentes. `demo:seed` crea datos sintéticos y direcciones ficticias únicamente en modo local: **no usar ese proyecto para Testnet**. Se pueden crear planes, sellarlos, registrar evidencias y preparar solicitudes; construir o enviar pagos se rechaza explícitamente en modo local.

## Conectar tu agente, después de instalar dependencias

```bash
npm install
npm run check:types
npm run test:adapters
npm run build:wallet
npm run test:browser
npm run configure:agent
```

El paquete no trae un lockfile inventado. Revisar las versiones fijadas, generar y guardar `package-lock.json`; a partir de entonces usar `npm ci`. Ver `docs/DEPENDENCIES.md`.

`configure:agent` genera ejemplos con rutas absolutas en `config/generated/`; **no instala ni cambia configuraciones globales**. Fusiona únicamente la entrada `hito` con la configuración de tu cliente. Reinicia su conexión MCP y verifica sus siete herramientas. Para usar la CLI sin MCP:

```bash
node --env-file=.hito-agent.env --experimental-strip-types src/cli/main.ts projects
```

Pídele al agente: «Usa Hito para preparar un borrador de este trabajo. No inventes presupuesto, partes ni pruebas. Desarrolla con nuestro flujo habitual; los pagos requieren firma humana».

## Las siete herramientas

`hito_get_context`, `hito_save_work`, `hito_update_progress`, `hito_submit_delivery`, `hito_check_readiness`, `hito_prepare_payment`, `hito_get_payment_status`.

El agente transforma el encargo en un plan estructurado. Hito no genera el plan mediante un modelo oculto. El token MCP no puede registrar wallets, sellar acuerdos ni solicitar construcción/firma/envío de XDR.

## Flujo económico diseñado

Borrador → sellado local → crear contrato de trabajo en cadena → proveedor acepta condiciones → pagador financia → proveedor registra hash de entrega → pagador aprueba esa evidencia → liberación al destinatario fijado.

Un hito agrupa un resultado cobrable, no cada commit. La primera versión admite 1–10 hitos remunerados; planificación gratuita/interna se añade posteriormente. Todas las cantidades son strings de unidades enteras del activo, no soles ni floats.

El contrato no juzga el software. Las evidencias locales son **declaradas**; los criterios `trusted_ci` bloquean aceptación preparada hasta implementar una procedencia verificable. El cliente sigue revisando y autorizando. Tras la aprobación on-chain, `release` es permissionless, pero no permite cambiar destinatario ni importe.

## Stack y límites de despliegue

Node/TypeScript + SQLite/WAL + HTTP local + MCP stdio; UI HTML/CSS/JavaScript y Freighter; Rust/Soroban; Stellar RPC Testnet. Sin Next.js, Redis, Kubernetes ni Postgres obligatorio para un recorrido local. Esta elección reduce piezas, no declara SQLite adecuado para un SaaS remoto multiusuario.

La API escucha solo en loopback y verifica Host/Origin. No exponerla mediante túneles ni cambiarla a `0.0.0.0`. `.env` no es un sandbox: un agente con acceso irrestricto al sistema operativo podría leerlo. Para una separación real, usar permisos/procesos/usuarios distintos.

## Mapa del repositorio

- `.specify/memory/constitution.md`: principios del producto y seguridad.
- `specs/001-hito-agent-native/`: especificación, arquitectura, tareas, contratos de interfaz y aceptación.
- `src/domain`, `src/storage`, `src/service`: reglas, persistencia e idempotencia.
- `src/server`, `src/client`, `src/cli`, `src/mcp`: interfaces sobre el mismo servicio.
- `src/stellar`, `src/wallet`, `contracts/hito-escrow`: integración económica.
- `public`: revisión humana, evidencias y firma.
- `tests/core`, `tests/adapters`: pruebas locales y de SDK separadas.
- `docs`: decisiones, amenazas, fuentes, test plan y runbooks.
- `prompts/LOCAL_AGENT_HANDOFF.md`: encargo completo para finalizar en tu máquina.

No se concede ninguna aprobación comercial por conectar una wallet o marcar una tarea DONE. No se ejecutan pagos reales ni se promete resolver todas las disputas. Ver [seguridad](docs/SECURITY.md) y [Testnet](docs/TESTNET_RUNBOOK.md).
