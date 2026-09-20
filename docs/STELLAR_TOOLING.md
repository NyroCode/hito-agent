# Herramientas Stellar: qué usar y para qué

La documentación oficial `Building with AI` recomienda Raven, un MCP remoto con documentación y datos del ecosistema, y presenta Stellar Skills mantenidas en `stellar/stellar-dev-skill`. Revisar fuentes en SOURCES. Esto no es una dependencia necesaria del servidor Hito.

## Recomendación de desarrollo

Instalar/activar las skills de Soroban, wallets, assets y RPC tras revisar su contenido. Raven puede ayudar a confirmar APIs; usa OAuth y requiere autorización del usuario. Ninguna de estas herramientas recibe la seed o el token admin de Hito.

Ejemplo oficial para Codex, sujeto a la versión instalada:

```bash
codex mcp add stellar-raven --url "https://raven.stellar.buzz/mcp"
codex mcp login stellar-raven
```

La conexión no está creada en esta entrega. No reemplazar el MCP Hito por Raven: uno aporta tooling de desarrollo, otro las operaciones del producto.

## stellar-build

`kaankacar/stellar-build` es una herramienta comunitaria que el sitio oficial referencia. Se revisó su descripción, no se ejecutó su instalador. Incluye personas/skills y comportamientos de aprendizaje que no son requisitos de Hito. Evitar una instalación global automática o `curl | bash` sin inspección. Preferir las skills concretas requeridas y mantener el flujo actual del usuario.

## Runtime mínimo

- Stellar JS SDK para XDR, simular, ensamblar y consultar.
- Freighter API en navegador para firma humana.
- SDK Rust Soroban para contrato y tests.
- CLI Stellar para test/build/deploy, alias de publicación gestionado por humano.
- RPC oficial Testnet para lectura/escritura, no Horizon como base de estado contractual.

## Fuera del MVP

x402 requiere valor real de servicio pagado; MPP, passkeys, anchors y entrada bancaria no son necesarios para el recorrido principal. No crear token propio por marketing. Un token de test sería solo fixture claramente identificado, nunca una inversión ni sustituto ficticio de USDC real.
