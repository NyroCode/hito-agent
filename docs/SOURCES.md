# Fuentes y decisiones — consulta 2026-09-20

## Cómo leer este registro

Las URLs siguientes son fuentes primarias consultadas por web. «Diseño Hito» es una decisión nuestra, no algo que el fabricante garantice. La entrega original registró un fallo DNS; la integración posterior sí resolvió dependencias/locks y verificó un tag estable de Spec Kit. No se ejecutó `init --force`.

| Fuente | Información utilizada / límite |
|---|---|
| https://github.com/github/spec-kit/releases/tag/v1.0.8 | Release revisado; tag `v1.0.8`, commit `0cc9a6a1159471a3108b9bad718ba17006dd6039`. |
| https://github.com/github/spec-kit | Metodología actual: constitución, especificación, plan, tareas, implementación y convergencia. |
| https://github.github.io/spec-kit/installation.html | CLI y fijación de versiones; no overwrite automático del proyecto. |
| https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md | Organización de escenarios, requisitos y criterios de éxito. |
| https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md | Contexto técnico, constitution check, research y contratos. |
| https://raw.githubusercontent.com/github/spec-kit/main/templates/tasks-template.md | IDs, fases y tareas trazables por historia. |
| https://developers.stellar.org/docs/build/building-with-ai | Raven/OAuth, Stellar Skills y diferencia con tooling comunitario. |
| https://github.com/stellar/stellar-dev-skill | Skills oficiales; contenido no vendorizado ni instalado aquí. |
| https://github.com/kaankacar/stellar-build | Instalador comunitario revisado; no adoptar sus loops como requisito del producto. |
| https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup | Toolchain y preparación de desarrollo Soroban. |
| https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet | Flujo de deploy de contratos de prueba. Sintaxis debe verificarse con CLI instalada. |
| https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization | Auth contractual; no equivale a juicio sobre calidad externa. |
| https://developers.stellar.org/docs/build/guides/storage/choosing-the-right-storage | Persistent/instance, TTL y archivado. |
| https://developers.stellar.org/docs/tokens/stellar-asset-contract | Puente de activos a contratos; revisar emisor y token concreto. |
| https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/simulateTransaction | Simulación antes de firma; resultado no es pago. |
| https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/sendTransaction | Broadcast y sus resultados; requiere consulta posterior. |
| https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getTransaction | Confirmación por hash; estados finales y no encontrado. |
| https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getNetwork | Comprobar passphrase de red. |
| https://raw.githubusercontent.com/stellar/js-stellar-sdk/master/package.json | Referencia del SDK JS y requisitos Node observados. No prueba instalación npm. |
| https://raw.githubusercontent.com/stellar/rs-soroban-sdk/main/Cargo.toml | Versión de SDK Rust observada en workspace. |
| https://github.com/stellar/rs-soroban-sdk/security/advisories/GHSA-4chv-4c6w-w254 | Incidencia específica corregida en 25.1.1; no auditoría completa. |
| https://developers.stellar.org/docs/build/guides/freighter | Integración de wallet y firma en el cliente. |
| https://docs.freighter.app/docs/playground/signTransaction | Forma documentada de signTransaction; comprobar API instalada. |
| https://developers.stellar.org/docs/build/agentic-payments/x402 | Pago por servicio HTTP; opcional, no implementado en esta entrega. |
| https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide | Requisitos de integración x402 y advertencias de claves de prueba. |
| https://modelcontextprotocol.io/docs/develop/build-server | Tools/resources/prompts, transporte y stdout. |
| https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/v1.x/package.json | Elección deliberada de SDK v1; rango compatible Zod. |
| https://developers.openai.com/codex/mcp | Configuración MCP; confirmar con versión del cliente. |
| https://agentskills.io/specification | Formato de skill; funciones específicas no universales. |
| https://stellar.mintedinpe.com/odyssey | Página oficial de Stellar Odyssey Perú: tracks, Testnet, equipos y resumen de entregables. |
| https://stellar.mintedinpe.com/bases | Bases oficiales: ventana 19–25 sep 2026, checkpoint 23 sep, elegibilidad, commit base, rúbrica y entregables. |

## Fuente del usuario

`Markdown(1).md pegado`, «Proyectos de AI Agents para Stellar Odyssey Perú», sección Hito/PagoJusto: hitos, custodia condicionada, evidencia y aprobación humana. Las fechas, rúbrica y reglas generales ya se cotejaron con las bases oficiales; la inscripción y elegibilidad concreta del equipo siguen siendo hechos que debe confirmar el usuario.

## Prioridad de especificación

La última decisión del usuario eliminó el orquestador interno y la auto-mejora autónoma: Hito se usa como herramienta por el modelo anfitrión y prepara pagos. Ese cambio es autoritativo frente a las primeras ideas del informe. SQLite, API local y siete tools son decisiones arquitectónicas de esta entrega, no requisitos impuestos por Stellar o Spec Kit.
