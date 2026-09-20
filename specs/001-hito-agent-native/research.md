# Research — decisiones basadas en fuentes

Consulta: 2026-09-20. Registro completo y links: `../../docs/SOURCES.md`.

## Spec Kit
El upstream organiza especificación, plan, tareas y convergencia; la constitución se establece una vez. Se inspeccionaron README, templates spec/plan/tasks y documentación de instalación. Los artefactos de esta carpeta son originales y siguen esa organización. No se ejecutó Specify ni se copió todo su repositorio. La sintaxis de invocación cambia según integración; no confundir skills de agente con comandos de shell.

## Stellar
Se eligieron Soroban/require_auth, activo SAC/SEP-41, RPC y Freighter. Simular/ensamblar no es firmar y enviar no es confirmar. getNetwork verifica passphrase. La app nunca posee seed; token y parties no vienen de texto libre del modelo. La necesidad de restoration se informa, no se «resuelve» creando otro escrow.

## MCP
Se usa SDK v1 estable seleccionado; no se mezclan ejemplos v2 con imports v1. STDIO evita OAuth remoto en la demo; API HTTP permanece loopback. El backend no recibe un prompt para ejecutar comandos del equipo.

## Alternativas rechazadas para v0.1
Next.js/Hono/Neon: razonables para un servicio desplegado, pero introducen red y frameworks antes de probar el flujo. x402: útil solo con un servicio pagado real; no requisito para registrar hitos. MPP/anchors/passkeys: fuera del problema inmediato. stellar-build: herramienta comunitaria revisada, no instalador ejecutado. Su loop de aprendizaje no pertenece al producto acordado.

## Incertidumbres abiertas
Resolución exacta de paquetes y types en la máquina local; compilación Rust; métodos/versiones del SDK instalados; Freighter real; balances/trustlines; política de expiración de intents; elegibilidad/bases originales; validación de demanda del producto. Ninguna se convierte en hecho positivo por existir código fuente.
