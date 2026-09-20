# Registro de decisiones arquitectónicas

## ADR-001 · Sin modelo interno
Aceptado. El host model redacta planes, desarrolla y usa subagentes. Hito valida y persiste. Ventaja: sin duplicación de contexto/coste. Límite: la calidad del plan sigue dependiendo del modelo y revisión del usuario.

## ADR-002 · Local primero, SQLite y Node nativo
Aceptado para demo. Permite core sin red, autenticación pequeña y tests reales. No es promesa de servicio cloud. Postgres/Neon será migración con diseño de concurrencia/auth, no requisito oculto del ZIP.

## ADR-003 · MCP stdio y API loopback
Aceptado. Un servicio único para CLI/MCP/UI. Agent token no admin. Transporte remoto OAuth pospuesto. No exponer puerto vía túnel para simular producción.

## ADR-004 · Acuerdos sellados inmutables
Aceptado. Evitar cambios de criterio/importe a mitad del pago. Ediciones solo DRAFT; amendments se diseñan después. Cancelación/nuevo trabajo explícitos para alcance distinto.

## ADR-005 · Evidencia declarada + aprobación humana
Aceptado. No desplegar un ejecutor arbitrario de repos ni un oráculo fingido. trusted_ci reservado y bloqueado. Puede añadirse como módulo con identidad, recetas y aislamiento comprobados.

## ADR-006 · Un contrato de escrow con activo inmutable
Aceptado como código de referencia, sujeto a revisión Rust. Work namespace evita colisiones. Sin upgrade/sweep. SDK/SAC existentes hacen transferencia; no crear un token de marketing.

## ADR-007 · Firma Freighter fuera del agente
Aceptado. El agente solo pide. Cuerpo/red/hash/source se verifican antes del broadcast. Permissionless release únicamente tras aprobación on-chain; no firma de modelo.

## ADR-008 · Persistir incertidumbre
Aceptado. Riesgo de duplicación supera comodidad de reintentar. Locks/txhash durables; recuperación de estados caducados necesita implementación adicional. Ningún timeout cambia obligación financiera.

## ADR-009 · x402 posterior
Aceptado. No esconderlo como implementado. Agregar solo un servicio real útil después del escrow. Compra de herramienta y pago por entregable usan presupuestos distintos.

## ADR-010 · Spec Kit para ingeniería, no runtime
Aceptado. Specs y tareas basadas en templates inspeccionados. Bootstrap upstream en staging, con versión revisada. Stellar skills/Raven opcionales para desarrollo; excluir auto-mejora de stellar-build del producto.
