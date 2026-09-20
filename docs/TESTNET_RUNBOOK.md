# Runbook Testnet — ejecución por el agente local y el humano

**No ejecutado en el contenedor. Solo activos de prueba.** Configurar una red no equivale a verificar un pago.

## 1. Prerrequisitos

Cerrar G1–G4; Node, paquetes/locks, cargo/rustc, target `wasm32v1-none`, CLI Stellar compatible, extensión Freighter disponible. Comprobar docs oficiales actuales y `stellar --version`, `rustc --version`, `cargo --version`.

El humano crea o selecciona **dos wallets de Testnet distintas**, pagador y proveedor. No copiar seeds al repo o al agente. Friendbot proporciona XLM de prueba para la cuenta/fees, no implica tener USDC. Elegir USDC de Testnet con issuer/SAC verificados desde fuente oficial o un token SEP-41 de prueba claramente etiquetado; nunca etiquetar un token arbitrario como USDC oficial.

Verificar trustlines/requisitos del activo, decimals y saldo de cada cuenta. Ambos roles necesitan capacidad de pagar fees en el flujo sin patrocinio. Cantidades = entero en unidades base; no asumir decimals=7 sin consultar token.

## 2. Contrato

```bash
npm run contract:test
npm run contract:build
# Revisar antes de ejecutar. Variables públicas; HITO_DEPLOYER es un alias seguro de CLI.
HITO_ALLOW_TESTNET_DEPLOY=yes HITO_DEPLOYER=ALIAS_PUBLICADOR HITO_TOKEN_CONTRACT_ID=CONTRATO_TOKEN_TESTNET   bash scripts/deploy-testnet.sh
```

El script usa `--network testnet` y pasa token al constructor. Confirmar sintaxis contra `stellar contract deploy --help` de la versión instalada. Registrar código WASM y su SHA-256, tx de despliegue e ID devuelto; verificar source contra WASM, `asset` y almacenamiento. No crear IDs ficticios para completar README.

Los tests de Rust crean su propio token in-memory: eso NO despliega un token de red.

## 3. Configuración local real

Detener backend antes de cambiar configuración. Mantener tokens API fuera de conversaciones. Configurar `HITO_MODE=testnet`, `HITO_CONTRACT_ID`, RPC oficial y scopes. Crear **nuevo proyecto** con wallets/token reales de Testnet desde UI admin. No reutilizar `demo` ni un work sellado con contrato UNCONFIGURED. `HITO_TOKEN_CONTRACT_ID` se usa en scripts; la API toma activo desde Project y lo coteja con `asset` del escrow.

```bash
# Solo información pública adicional requerida por el preflight:
HITO_TOKEN_CONTRACT_ID=... HITO_PAYER_ADDRESS=... HITO_PAYEE_ADDRESS=... node --env-file=.env scripts/testnet-preflight.mjs
```

Preflight confirma la red, no ownership, balances ni code hash. Verificar eso separadamente.

## 4. Recorrido de un hito

1. Agente consulta contexto y guarda plan con total acordado (p.ej. 10 unidades del token de prueba convertidas exactamente a base units). Humano revisa y sella.
2. Agente prepara `create`; admin construye; pagador revisa/firma Freighter; enviar y reconciliar hasta SUCCESS o FAILED. Guardar hash/ledger.
3. `accept`: firma proveedor del planHash exacto. No aceptar otro compromiso.
4. `fund`: firma pagador, transferencia total al escrow. Comparar balances del token, aparte de fees XLM.
5. Agente realiza el trabajo con sus herramientas. Registra un resultado real de artefacto/criterios. No afirmar pruebas CI independientes.
6. `submit`: proveedor registra evidenceHash actual en cadena. Registrar transacción y consultar estado.
7. `approve`: pagador revisa resultados y firma esa evidencia. Un FAIL no debe estar preparado como ready; el contrato no lee el texto de pruebas, por eso la decisión del pagador es sustantiva.
8. `release`: transferencia fija al proveedor después de aprobación. Desde la UI se usa cuenta del pagador para la transacción; el método contractual es permissionless y puede llamarlo otro pagador de fee sin cambiar el destinatario.
9. Repetir release debe fallar sin segunda transferencia. Guardar error y balances. Una simulación fallida no tiene necesariamente un evento confirmado.

No saltar a la siguiente firma mientras la anterior siga UNKNOWN. La ventana XDR es 900 s (15 min). Si caduca, seguir la política de recovery documentada, no borrar locks.

## 5. Otros escenarios, works separados

Cancel antes de financiar; cancelar financiado con request_cancel del proveedor y cancel del pagador; vencimiento sin entrega; vencimiento con entrega presentada debe protegerla. Evidencia sustituida antes de aprobar: viejo hash rechazado. Aprobación de milestone con dependencia sin pagar: rechazo. Falta auth: rechazo.

## 6. Recibos y cierre

Crear `reports/local-.../testnet-receipts.json` usando `examples/testnet-receipts.template.json`. Sustituir null SOLO por datos reales; no contar NOT_RUN como PASS. Guardar estado antes/después, balances, llamadas de lectura, hash, ledger, timestamp de red y network passphrase. Sanitizar seeds/tokens; public addresses y hashes sí pueden ir en demo con autorización.

## 7. Reset Testnet y storage

Si hay reset de Testnet, contratos/cuentas previos pueden dejar de existir. No concluir que un hash antiguo nunca ocurrió: conservar informe histórico y nueva namespace/proyecto para otra demo. Persistent storage archivado requiere restore, no crear otro Work con el mismo identificador. Mantener TTL con touch y monitorización/restore diseñados antes de producción.
