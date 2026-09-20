# Modelo de amenazas y límites

**Prototipo exclusivamente Testnet. No auditado. No usar fondos reales.** Los rechazos locales no demuestran por sí solos seguridad contractual.

| Amenaza | Control implementado o diseñado | Límite / prueba pendiente |
|---|---|---|
| Modelo inventa destinatario | Registro inmutable y derivación server-side | Admin debe verificar wallets públicas; ownership no probado automáticamente |
| Modelo firma con API key | No tool de signing; build/submit admin; Freighter | Agente con permiso de leer todo el OS puede robar token admin, no seed wallet |
| Otro proyecto | scopes del token en todas las lecturas/escrituras | Una sola credencial agent en demo; no tenant SaaS |
| Dinero en float/overflow | enteros positivos i128, suma exacta; Rust local PASS | balances Testnet pendientes |
| Reintento duplica | idempotencia SQLite, lock de fuente, estado contractual | No coordina otros programas externos que usan la misma wallet |
| Firma manipulada | body hash/origen/red y firma SDK real probados | extensión Freighter y envío Testnet pendientes |
| NOT_FOUND tratado como fallo | UNKNOWN y lock conservados; recovery no libera READY por NOT_FOUND | Retención RPC e historial externo todavía limitan la recuperación completa |
| Evidencia falsificada | provenance self_reported no elevable a trusted | Un agente puede mentir en un reporte declarado; el pagador debe revisar |
| URL maliciosa | se almacena, no se solicita ni ejecuta | Servicio de verificación futuro necesitaría SSRF/sandbox |
| Prompt injection en evidencias | Datos estructurados, ninguna ejecución dinámica | Cliente anfitrión debe tratar texto como datos no instrucciones |
| Web maliciosa llama a localhost | token, Host/Origin exactos, CSP, no CORS | No protege frente a proceso local con acceso al token |
| Rollback/edición DB por operador | firmas y estado económico on-chain | Audit local no es inmutable; copias/retención pendientes |
| Contrato se archiva | persistencia y TTL/touch, no delete de IDs | Restaurar requiere flujo explícito aún no integrado |
| Fondos bloqueados por disputa | cancelación bilateral; sin devolución unilateral de entregas | No árbitro. Una entrega presentada puede bloquear fondos indefinidamente |

## Capas de confianza

La firma autoriza una operación, no garantiza calidad del software. El hash vincula un contenido, no certifica verdad. La clasificación trusted_ci está reservada y actualmente bloqueada; no se la puede habilitar con un booleano. Un verificador autorizado que miente seguiría siendo un problema fuera del contrato.

El código Rust usa un activo fijo por despliegue. El operador debe comprobar que es el token esperado, con issuer/decimals verificados. No cualquier contrato con métodos transfer/balance es digno de confianza. No hay soporte de tokens con comisiones/rebases peculiares como equivalentes silenciosos a USDC.

## Cancelación/fechas

No hay aceptación por silencio. Después del deadline se bloquean nuevas submissions, pero entregas existentes pueden revisarse y liberarse. `refund_expired` no confisca trabajo presentado sin resolver. Eso evita una regla abusiva, pero deja disputa sin solución automática; registrarlo antes de financiar.

## Recovery de intents — alcance probado

`PREPARING` nuevo utiliza una lease de 300 segundos y fencing por intento. Tras vencer, el admin puede recuperar únicamente cuando no hay hash ni envelope firmado; un builder tardío ya no puede publicar READY. La transición queda auditada y libera el lock. `PREPARING` legacy sin timestamp permanece bloqueado. Las regresiones cubren builder tardío, autoridad admin, crash-before-broadcast y carrera broadcast/reconcile.

READY vencido puede contener XDR que el humano firmó y envió fuera de la aplicación. Recovery consulta el hash original y solo cierra ante `SUCCESS` o `FAILED` terminal. `UNKNOWN`/`NOT_FOUND`, un checkpoint `SUBMITTING` ambiguo o una RPC caída conservan el lock. Para liberar esos casos se requieren timebounds/último ledger, estado contractual y una política de retención/indexación que demuestre que ninguna ejecución válida sigue pendiente. No eliminar locks directamente en SQLite ni generar otro pago.

Para la primera demo, revisar y firmar dentro de la ventana de 180 s y reconciliar inmediatamente; si READY queda incierto, detener el recorrido. La recuperación PREPARING está probada localmente, pero READY incierto mantiene G4 parcialmente bloqueado hasta validar retención/estado contra Testnet.

## Cadena de suministro

No se ejecutó `curl | bash`. Instalar dependencias con revisión de manifests y lock. No ejecutar instaladores de skills que cambien ~/.config o conocimientos compartidos sin revisión. Stellar Skills/Raven son herramientas de desarrollo; no concederles wallets ni secretos del cliente. El servidor MCP Hito no depende de Raven para funcionar.

## Alcance de no-Mainnet

La app, scripts y adapter restringen Testnet. Un WASM de Soroban por sí solo no impide que una persona lo despliegue en otra red. No atribuir al contrato una restricción de red que no implementa. Gate de publicación: no incluir scripts ni configuración de Mainnet.
