# Checklist de requisitos

- [x] Última definición del usuario preservada: herramienta, no agente.
- [x] Plan, pagos y evidencia separados de implementación de código.
- [x] Historias, FR, datos, errores, límites y pruebas negativas documentados.
- [x] Modo local no fabrica pagos ni verificaciones independientes.
- [x] Núcleo local probado; salidas conservadas.
- [ ] Instalar y fijar dependencias/lockfiles.
- [ ] Tipado estricto sin errores.
- [ ] Probar MCP SDK en cliente real.
- [ ] Rust compile/test y revisión autorización sin mocks globales.
- [ ] Recuperación segura de READY/PREPARING caducados.
- [ ] Browser E2E y Freighter real.
- [ ] Testnet con contratos/recibos verificables y balances.
- [ ] Cotejar reglamento primario y ventana permitida del concurso.

Una casilla no marcada no es un fallo conocido necesariamente: es un gate no demostrado. No cerrar por lectura de código solamente.
