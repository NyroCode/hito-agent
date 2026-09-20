# Empieza aquí

**Hito 0.1.0 — entrega de código y arquitectura, 20 de septiembre de 2026.**

Este ZIP contiene un núcleo local ejecutable y código de integración para completar y validar en tu equipo. **No es una aplicación desplegada, auditada ni probada de extremo a extremo en Stellar.**

1. Abre la carpeta con tu agente y dale `prompts/LOCAL_AGENT_HANDOFF.md`.
2. Antes de modificar, lee `AGENTS.md`, `README.md` y `reports/build/VALIDATION.md`.
3. Reproduce `npm run check` y `npm test`. El modo local no necesita instalar paquetes npm.
4. Para usar la interfaz: `npm run setup`, `npm start` y, en otra terminal, `npm run demo:seed`.
5. El agente debe cerrar los gates de `docs/REMAINING_GATES.md` antes de anunciar una demo on-chain.

No uses dinero real. No pegues una seed en ningún archivo o conversación. El token de API no es una clave de wallet. Ningún archivo de configuración personal, base de datos ni secreto viene dentro del ZIP.

La constitución y especificaciones siguen la organización de Spec Kit; el CLI upstream no está incluido ni se ejecutó aquí. La instalación revisada y no destructiva está descrita en `docs/SPEC_KIT.md`.
