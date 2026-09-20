# Instrucciones para trabajar en Hito

## Canon de producto

Hito es una HERRAMIENTA. El modelo del usuario hace planes y programa. No añadir LLM propio, orquestador autónomo, repo ingestion, memoria que cambia skills, agentes autoevaluadores ni cobro por cada llamada. No sustituir Linear ni duplicar tareas existentes. Cambios de producto requieren decisión explícita.

## Orden

Leer `START_HERE.md`, `.specify/memory/constitution.md`, `specs/001-hito-agent-native/spec.md`, `plan.md`, `tasks.md`, `docs/REMAINING_GATES.md` y `reports/build/VALIDATION.md`. La documentación describe fuente implementada y gates pendientes por separado.

## Comandos

- `npm run check`: sintaxis nativa, NO tipado.
- `npm test`: pruebas core reales, sin paquetes npm.
- `npm run check:types`: tsc después de instalar.
- `npm run test:adapters`: SDK Stellar y protocolo MCP después de instalar.
- `npm run build:wallet`: bundle de extensión; no demuestra firma.
- `npm run contract:test`, `npm run contract:build`: requieren toolchain Rust y dependencias.
- `npm run verify:local`: guarda un nuevo informe local sin sobrescribir `reports/build`.

## Barreras

No leer ni imprimir seeds, cookies, credenciales de otros proyectos ni el token humano de `.env`. No añadir secretos a fixtures. El agente obtiene solo `.hito-agent.env`. Las pruebas pueden generar credenciales efímeras propias.

No publicar, financiar, firmar, instalar wallets ni cambiar permisos globales sin autorización del usuario. Local tests y cambios dentro de este repo sí forman parte del encargo. Si falta wallet, terminar las demás fases y dejar ese gate bloqueado.

No cambiar a Mainnet. No crear un registro `paid=true` por inferencia. Timeout/NOT_FOUND mantienen incertidumbre y hash original. No borrar un source lock para «arreglar» un pago incierto.

No desactivar una prueba para obtener PASS. Modificar una prueba solo con justificación y caso que conserva la intención. Registrar comandos, salidas, versiones y limitaciones. «Compila», «MCP conecta», «firma» y «Testnet confirma» son afirmaciones distintas.

## Colaboración y Spec Kit

Usar los subagentes existentes para módulos independientes; integración única con pruebas compartidas. Constitución y criterios no se reescriben para adaptarse al código. No ejecutar `specify init --force` sobre esta entrega: preparar integración upstream en staging y fusionar de forma selectiva. No agregar un segundo plan comercial ni nuevos archivos de memoria redundantes.
