# Checklist de requisitos

- [x] Última definición del usuario preservada: herramienta, no agente.
- [x] Plan, pagos y evidencia separados de implementación de código.
- [x] Historias, FR, datos, errores, límites y pruebas negativas documentados.
- [x] Modo local no fabrica pagos ni verificaciones independientes.
- [x] Núcleo local probado; salidas conservadas.
- [x] Instalar y fijar dependencias/lockfiles.
- [x] Tipado estricto sin errores.
- [x] Probar MCP SDK con cliente de protocolo real; integración del host de agente es manual.
- [x] Rust compile/test y auth exacta/negativa sin depender solo de mocks globales.
- [ ] Recuperación: PREPARING cerrada; READY incierto conserva bloqueo hasta prueba de red/retención.
- [ ] Browser E2E PASS; Freighter real requiere wallet humana.
- [ ] Testnet con contratos/recibos verificables y balances.
- [x] Cotejar reglamento primario y ventana permitida del concurso.

Una casilla no marcada no es un fallo conocido necesariamente: es un gate no demostrado. No cerrar por lectura de código solamente.
