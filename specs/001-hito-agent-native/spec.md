# Feature Specification: Hito agent-native

Feature: `001-hito-agent-native` · Fecha: 2026-09-20 · Estado: implementado parcialmente, validación por capas pendiente.

## Input y alcance
El usuario quiere usar Hito como usa herramientas de Linear: su modelo construye los planes y desarrolla; Hito gestiona hitos, evidencias y preparación de pagos. No se requiere subir el repositorio ni un modelo nuevo. La arquitectura previa de auto-mejora queda excluida.

## User scenarios & testing

### US1 · Planificar desde el agente (P1)
Como dueño, quiero pedir a mi agente que prepare un trabajo con hitos verificables, sin trasladar el desarrollo a otra plataforma.

**Independent test:** guardar y recuperar un borrador por HTTP; repetir la petición con la misma clave no crea otro trabajo.

- Given proyecto autorizado y presupuesto conocido, When el agente guarda un plan válido, Then existe un único DRAFT con importes exactos y criterios.
- Given otro proyecto fuera del scope, When consulta o modifica, Then 403.
- Given edición concurrente, When expectedVersion está desactualizado, Then 409 sin perder datos.
- Given trabajo sin precio acordado, Then el agente no inventa importes. En esta v0.1, guarda el análisis fuera del flujo económico hasta conocerlos; planes gratuitos son una extensión.

### US2 · Registrar entregas (P1)
Como equipo, queremos mantener nuestro modelo y subagentes, pero registrar la versión y los resultados sin declarar independencia inexistente.

**Independent test:** evidencia NOT_CHECKED no queda lista para revisión; todos PASS self_reported permiten revisión humana, no aceptación automática.

- Given borrador no sellado, When presenta evidencia, Then rechazo.
- Given criterio ausente, repetido o desconocido, Then rechazo.
- Given criterio trusted_ci y solo reporte local, Then bloqueado.
- Given otra entrega, Then su digest es distinto y no se puede aprobar una evidencia no registrada.

### US3 · Preparar pago con separación de autoridad (P1)
Como cliente, quiero revisar el compromiso, financiarlo y aprobar una entrega concreta antes de que se pague.

**Independent test:** agente prepara Intent; no puede build/submit XDR. Tests SDK/Rust/Testnet adicionales son obligatorios.

- Given intent creado por el agente, Then no firma ni transfiere fondos.
- Given firma con otro cuerpo/red/origen, Then rechazo.
- Given resultado incierto de envío, Then persiste hash original y source lock.
- Given aprobación on-chain de evidencia A, Then evidencia B no permite release.
- Given release confirmado, Then una segunda liberación falla sin segunda transferencia.

### US4 · Cancelación y consulta (P2)
Como partes, queremos conocer el estado real y resolver los casos simples de cancelación.

- Financiado requiere consentimiento del proveedor para cancelación ordinaria.
- Después de vencimiento, solo se devuelve unilateralmente cuando no queda ninguna entrega presentada sin resolver.
- Una entrega presentada puede mantener fondos bloqueados: no hay arbitraje en v0.1.
- Las respuestas tardías no reemplazan SUCCESS/FAILED ya confirmados por UNKNOWN.

## Functional Requirements

| ID | Requisito |
|---|---|
| FR-001 | No modelo interno ni ejecución arbitraria del repositorio. |
| FR-002 | Registro humano de proyecto, wallets y activo inmutables; scopes por proyecto. |
| FR-003 | Plan estructurado de 1–10 hitos con 1–12 criterios; dependencias anteriores sin ciclos. |
| FR-004 | Edición optimista de DRAFT y sellado humano; compromiso SHA-256 del acuerdo completo. |
| FR-005 | Idempotencia durable por actor, operación, clave y contenido; conflicto si reutiliza clave distinta. |
| FR-006 | Evidencia asociada a acuerdo, hito, artefacto y versión; resultados explícitos. |
| FR-007 | Separar preparación para revisión, aceptación y pago; procedencia local no independiente. |
| FR-008 | Siete herramientas MCP estrechas; ninguna firma o transacción arbitraria. |
| FR-009 | Admin construye; humano firma Freighter; servidor valida cuerpo exacto y red. |
| FR-010 | Patrón build/simulate/assemble/sign/send/poll con original hash persistente. |
| FR-011 | Soroban exige autoridad por rol, impide doble pago y fija destino/importe. |
| FR-012 | Aceptación de proveedor antes de funding y de pagador antes de release. |
| FR-013 | Refund/cancel explícitos que no confiscan unilateralmente trabajo presentado. |
| FR-014 | Auditoría local, secretos excluidos, HTTP loopback con Host/Origin restringidos. |
| FR-015 | Testnet-only en conectores/scripts; no marcar acciones económicas simuladas como reales. |
| FR-016 | Evidencia del desarrollo exportada con pruebas ejecutadas, bloqueadas y no ejecutadas. |

## Non-functional requirements

NFR-01: Node strict TypeScript; tipado es gate distinto de syntax. NFR-02: entero positivo limitado a i128 y suma sin overflow. NFR-03: tamaño HTTP máximo 256000 bytes y timeout de cliente 25s. NFR-04: no red en dominio. NFR-05: una sola acción en preparación/envío por cuenta origen. NFR-06: stdout MCP exclusivamente protocolo. NFR-07: no recuperación peligrosa por timeout. NFR-08: desconocidos en inputs rechazados. NFR-09: pruebas locales reproducibles sin acceso a cuentas.

## Key entities
Project, Work/Plan, Milestone, Criterion, Delivery, Progress, Intent, AuditEntry, IdempotencyRecord y SourceLock. Ver `data-model.md`.

## Success criteria

- SC-01: US1/US2 reproducibles usando API y posteriormente un cliente MCP real, sin mover secretos del usuario.
- SC-02: intento de firma/pago por token agente rechazado en pruebas negativas.
- SC-03: recorrido Testnet create/accept/fund/submit/approve/release con contract ID, hashes, ledger y balances verificados.
- SC-04: reintento no duplica trabajo ni transferencia; falsa aceptación, evidencia vieja y firma alterada rechazadas.
- SC-05: UI diferencia borrador, evidencia declarada, solicitud, envío y confirmación.
- SC-06: un agente de usuario usa sus propias herramientas para implementar; Hito solo registra y prepara operaciones.

SC-03 y compatibilidad real MCP/wallet NO están satisfechos por esta entrega. No hay promesa cuantitativa de ahorro, adopción o premio.

## Assumptions y exclusiones
Demo local de un operador con wallets separadas; no SaaS público. Un token/activo por despliegue. No fiat, FX, NFTs, passkeys, arbitraje, oráculo, x402, múltiples firmantes por wallet ni CI independiente todavía. No se confunden direcciones sintéticas con cuentas Testnet. Bases originales de concurso pendientes de cotejo.
