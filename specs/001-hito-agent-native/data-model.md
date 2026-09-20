# Modelo de datos y estados

## Project
`id, name, payer, payee, tokenContract, tokenLabel, decimals`. Registro admin e inmutable. Direcciones públicas G para roles; contrato C para token. Validación sintáctica local; checksum real, activo y decimals se verifican con SDK antes de construir. Modelo de demo admite direcciones sintéticas solo local.

## Work / Plan
`id, projectId, version, state, plan, planHash, createdAt`. Plan contiene `title, description, deadline, totalUnits, milestones[]`. Hitos: `id, title, amountUnits, criteria[], dependsOn[]`. Montos son strings de unidades base. No flotantes, ceros, negativos, exponentes o suma mayor que i128.

DRAFT admite actualización con expectedVersion. SEALED no se reescribe. El compromiso `hito.agreement.v1` contiene red, escrow, work/project, partes, activo/decimals y plan entero. Canonicalización propia con keys ordenadas; no afirmar cumplimiento JCS/RFC8785. Los hashes se calculan desde JSON validado, nunca desde un texto suministrado como «hash aprobado».

## Delivery
`id, workId, milestoneId, planHash, artifactHash, reference, checks[], provenance, createdAt, evidenceHash`. El cliente entrega digest SHA-256 de artefacto; Git SHA-1 por sí solo no cumple 64 hex. Guardar identificador de commit en reference/detail y hash del artefacto en artifactHash. La URL se almacena sin hacer fetch; no hace SSRF ni prueba disponibilidad.

Cada criterionId aparece exactamente una vez. PASS/FAIL/NOT_CHECKED no es una escala numérica. provenance siempre self_reported en este MVP. Una declaración no puede transformarse en trusted_ci por añadir un campo. Cambiar versión/checks produce una entrega diferente. En cadena se compromete evidenceHash.

## Progress
Una nota por work/hito con status y timestamp; otra actualización reemplaza estado visible y conserva audit action. No controla aprobación ni dinero. GET contexto incluye progress. Subagentes pueden informar; el servicio no los ejecuta.

## Intent
Solicitud estrecha con action, workId, milestoneId/evidenceHash donde aplican, source derivado de roles. No amount ni recipient libre. Estados:

`REQUESTED → PREPARING → READY → SUBMITTING → SUBMITTED/UNKNOWN → SUCCESS/FAILED`.

Build error: BUILD_FAILED sin firma enviada. Terminales confirmados no retroceden. READY contiene unsignedXdr y txHash; signedXdr se conserva para reconciliación después de intentar envío. Los GET públicos al agente excluyen ambos envelopes. Solo admin build entrega unsignedXdr.

`PREPARING` guarda `preparingAt` y un identificador interno de intento de build. Una lease de 300 segundos permite que un admin recupere el estado solo si no existen `txHash` ni envelope firmado; el build tardío queda invalidado por fencing, se audita la recuperación y se libera el source lock. Registros legacy sin timestamp permanecen bloqueados.

Un `READY` vencido conserva el lock y consulta el hash original. Solo un resultado terminal `SUCCESS` o `FAILED` permite cerrar y liberar. `UNKNOWN`, `NOT_FOUND`, un checkpoint `SUBMITTING` ambiguo o una caída de RPC nunca prueban que sea seguro reconstruir. Los campos internos de fencing y los envelopes no aparecen en la proyección pública.

## SQLite
Tabla documents con kind/id/project_id/body. Tipos separados por kind. idempotency scope+key+inputhash+response, transaction BEGIN IMMEDIATE. Mismo input/key devuelve respuesta original aun si el reloj cambió; distinto input/key es conflicto. source_locks unique(source) evita usar a la vez la misma secuencia desde este backend. WAL y busy_timeout; archivo local protegido por permisos del sistema. auditoría local no es un registro inmutable contra un admin de la máquina.

## Soroban Work
Payer/payee/planhash/deadline/total/remaining, accepted/funded/closed/cancel_requested, milestones con amount, dependency bitmask, evidence, has_evidence, approved, paid. WorkID onchain = SHA256(namespace + projectId + workId). Token inmutable en instancia, works persistentes. Sin borrado de IDs cerrados, para conservar antireplay. Extend TTL/touch y restauración son operaciones distintas.

Invariantes: suma de obligaciones financiadas remanentes ≤ saldo escrow si no hay transferencias externas extra; release reduce remaining una vez; no refund de obligación presentada sin resolver; dependencia exige pago anterior; approval vincula evidence exacta. Tests Rust locales cubren lifecycle, overflow, doble release, rollback y aislamiento; Testnet/balances reales siguen pendientes.
