# ABI y reglas contractuales

Fuente normativa de esta entrega: `contracts/hito-escrow/src/lib.rs` en raíz. No hay WASM compilado validando todavía esta ABI.

| Método | Argumentos | Autoridad |
|---|---|---|
| __constructor | token: Address | despliegue; fija activo |
| asset | — | lectura |
| get | wid: BytesN32 | lectura |
| touch | wid | cualquiera, TTL |
| create | wid,payer,payee,plan_hash,amounts:Vec<i128>,dependencies:Vec<u32>,deadline:u64 | payer |
| accept | wid,expected_plan | payee |
| fund | wid | payer y transferencia del token |
| submit | wid,index:u32,evidence:BytesN32 | payee |
| approve | wid,index,expected_evidence | payer |
| release | wid,index,expected_evidence | cualquiera después de approval |
| request_cancel | wid | payee |
| cancel | wid | payer; consentimiento previo payee si funded |
| refund_expired | wid | payer; sin submitted pendiente |

Tokens y wallets vienen del proyecto registrado; el tool del agente no los recibe como parámetros. dependency mask usa bit j para milestone anterior j, index máximo9. chainWorkId se calcula en `src/stellar/adapter.ts`; no pasar work UUID directamente como bytes32.

Errores se convierten en rechazos de simulación o transacción; no emitir «evento confirmado de rechazo» si el estado revirtió. Los eventos exitosos created/accepted/funded/submitted/approved/paid/cancelreq/cancelled/refunded sirven de rastreo, pero esta v0.1 no incluye un indexer durable de eventos: usa hash/estado y receipts. TTL/restoration deben probarse aparte.
