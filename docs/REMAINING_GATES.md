# Gates restantes antes de la demo completa

**Todo lo listado aquí sigue pendiente al empaquetar, salvo que el informe local posterior aporte evidencia.**

| Gate | Prioridad | Trabajo | Cierre verificable |
|---|---|---|---|
| G1 | P0 | Resolver paquetes y compatibilidad; generar lockfiles | npm install/ci + tsc + audit documentado |
| G2 | P0 | MCP real en un agente + skill explícita | listar y llamar siete tools; registrar transcript sanitizado |
| G3 | P0 | Compilar Rust y ejecutar tests | cargo fmt/clippy/test/build; revisar auth y balances |
| G4 | P0 | Freighter, firma, errores y recuperación intents | navegador real y tests de expiración/crash sin duplicación |
| G5 | P0 | Activo y contrato correctos en Testnet | WASM/contract/hash/ledger/balances reales |
| G6 | P0 | Arranque desde copia limpia y video | agente crea trabajo, error demostrable y pago autorizado |
| G7 | P1 | Verificar reglamento primario | enlaces/documento del organizador, elegibilidad y fechas |
| G8 | P2 | x402 opcional | servicio útil real, presupuesto, recibo; nunca mock 402 como protocolo |
| G9 | Posterior | Cloud, OAuth, tenants, CI independiente | otra especificación y threat model |

## Problemas/limitaciones concretos a tratar, no esconder

- Dependencias no instaladas por DNS del contenedor. El source compile del SDK, el bundle y los tests de protocolo pueden necesitar ajustes basados en typings reales.
- Node strip-types no es TypeScript typecheck. SQLite de Node 22 es experimental en el entorno usado.
- READY/PREPARING abandonados bloquean fuente hasta recuperación segura. No borrar lock para seguir la demo.
- El browser del entorno negó localhost; UI visual/responsive/E2E no verificada.
- Contrato no auditado, sin arbitraje, sin producción. Tests con mock_all_auths no sustituyen auth negatives.
- No existe integración trusted_ci ni verificación automática de pruebas del repo; todos los reports locales son declarados.
- No soporte remoto multiusuario ni demostración de ownership de wallets por challenge.
- Milestones remunerados exclusivamente en v0.1. Planificación interna sin importe es una evolución, no fingir amount=0.

Ningún gate bloqueado exige descartar el proyecto: terminar lo que se pueda comprobar y entregar un informe preciso. No cambiar a otra arquitectura para evitar la prueba.
