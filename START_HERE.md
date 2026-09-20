# Empieza aquí

**Hito 0.1.0 — integración local verificada, 20 de septiembre de 2026.**

Este ZIP contiene el núcleo local, locks npm/Cargo, contrato compilable, interfaz probada en Chromium y evidencia reproducible. **No es una aplicación desplegada, auditada ni probada de extremo a extremo en Stellar Testnet:** la extensión Freighter, las firmas humanas y las transacciones de red siguen pendientes.

1. Abre la carpeta con tu agente y dale `prompts/LOCAL_AGENT_HANDOFF.md`.
2. Antes de modificar, lee `AGENTS.md`, `README.md`, el informe actual `reports/local-20260920T190853Z/VALIDATION.md` y el histórico `reports/build/VALIDATION.md`.
3. Reproduce `npm run check` y `npm test`. El modo local no necesita instalar paquetes npm.
4. Para usar la interfaz: `npm run setup`, `npm start` y, en otra terminal, `npm run demo:seed`.
5. Revisa `docs/REMAINING_GATES.md`: G2 host, G4 Freighter real y G5/G6 Testnet/video no están cerrados y no deben anunciarse como demo on-chain.

No uses dinero real. No pegues una seed en ningún archivo o conversación. El token de API no es una clave de wallet. Ningún archivo de configuración personal, base de datos ni secreto viene dentro del ZIP.

La constitución y especificaciones siguen la organización de Spec Kit; el CLI upstream no está incluido ni se ejecutó aquí. La instalación revisada y no destructiva está descrita en `docs/SPEC_KIT.md`.
