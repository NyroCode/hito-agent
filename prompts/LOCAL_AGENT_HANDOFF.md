# PROMPT MAESTRO — llevar Hito a una demo comprobada

Actúa como integrador senior de TypeScript/MCP y Stellar/Soroban. Trabaja sobre este repositorio, no lo reemplaces por un scaffold. Tu encargo es revisar la arquitectura, cerrar las integraciones pendientes, ejecutar pruebas y entregar evidencia reproducible. Tienes acceso al equipo del usuario, pero eso no autoriza leer secretos ni firmar pagos por él.

## 1. Producto que debes preservar

Hito es una herramienta usada por el modelo del usuario, igual que usa herramientas de Linear. Tú generas hitos, interpretas el encargo y desarrollas con tus subagentes/herramientas. Hito guarda acuerdos/evidencias y prepara pagos. NO construir otro LLM, agente programador, auto-mejora, repo ingestion, memory daemon o marketplace. Documentar mejoras solo cuando el usuario las solicite, no en automático.

Un hito es un resultado aceptable/cobrable, no cada tarea técnica. Montos/partes no se inventan. La implementación actual requiere 1–10 hitos remunerados; no añadir amount=0 para simular trabajo interno.

## 2. Leer antes de modificar

Lee START_HERE, README, AGENTS, la constitución, spec/plan/data-model/tasks/research/contratos, SECURITY, TEST_PLAN, REMAINING_GATES y reports/build/VALIDATION. No confundir fuente escrita con integración validada. El core se ejecutó en Node 22.16; paquetes, Rust, browser y Testnet tienen gates pendientes.

Inspecciona git status. Si no hay repo, crea baseline local y registra hash; no hagas push ni publiques sin autorización. Conserva pruebas y logs originales; los nuevos van en reports/local-<timestamp>.

## 3. Investigación puntual y Spec Kit

Consulta repo oficial github/spec-kit y docs actuales; usa versión/tag/commit revisado. Verifica sintaxis instalada. El proyecto YA tiene specs originales; no ejecutar init --force ni reescribir constitución. Puedes usar bootstrap en staging y fusionar integración de tu cliente. Usa clarify/analyze solo para inconsistencias específicas, tasks/implement/converge para cerrar pendientes, no para volver a idear otro producto.

Consulta documentación oficial Stellar de auth, tokens/SAC, RPC, storage, testing y Freighter. Stellar Skills y Raven son opcionales de DESARROLLO; activarlos requiere revisar configuración/autorización. No instalar stellar-build global ni activar sus loops de auto-mejora. No curl|bash sin revisar contenido.

## 4. Orden de ejecución obligatorio

### Fase A: reproducir lo local

Registrar Node/npm/OS. Ejecutar `npm run check`, `npm test`, `npm run verify:local`. Si hay fallo: reproducirlo, explicar causa, cambiar mínimo y añadir regresión. No contar syntax como tsc ni fakeChain como Testnet.

Usar tokens efímeros para tests. No leer el token admin humano desde .env. setup puede generar configuración; el usuario introduce su token en la UI. No imprimir variables de entorno completas.

### Fase B: dependencias y protocolo

Verificar versiones candidatas y publicaciones desde fuentes oficiales. Instalar, generar package-lock y auditar. No usar npm ci hasta existir lock válido. Ejecutar tsc; corregir tipos y APIs con typings del paquete real. Construir wallet. Ejecutar tests/adapters; comprobar handshake MCP, listar las siete tools y realizar un plan/delivery/status con backend real. STDIO no tiene console.log extra.

Generar configuración local mediante configure:agent; fusionar solo la entrada Hito en tu cliente con autorización. No sobrescribir conexiones existentes. El MCP recibe solo token agent y scopes concretos.

### Fase C: contrato

Instalar/verificar toolchain autorizado; generar Cargo.lock; fmt/clippy/test/build wasm32v1-none. Corregir cualquier incompatibilidad con SDK fijado. Revisar autenticación negativa SIN mock_all_auths, replay, overflow, balances, cancelación, expiry, dependencias, aislamiento entre works y rollback de token. Revisar TTL/restoration. Cambios contractuales deben actualizar ABI y tests TypeScript.

### Fase D: UI, wallet y recuperación

Ejecutar navegador real desktop/móvil; añadir tests Playwright con credenciales efímeras, no perfil personal. Verificar CSP, no XSS y no secretos persistentes. Probar denegar firma, otra wallet/red, hash/cuerpo modificado, expiración.

Cerrar problema documentado READY/PREPARING abandonados. No borrar source_locks ni transformar NOT_FOUND en FAILED. Diseñar recuperación que consulte estado/ledger/timebounds y permita demostrar que ninguna transacción puede aún ejecutarse, conservando auditoría. Si no puedes probar seguridad, conservar bloqueo y reportar gate pendiente.

### Fase E: Testnet con el humano

No tocar Mainnet ni dinero real. No crear/importar seeds por tu cuenta. El usuario proporciona public addresses y firma Freighter; no hace falta conocer su seed. Con autorización de deploy, usar alias seguro, token Testnet comprobado, constructor inmutable y runbook. Si falta wallet/permiso, terminar otras fases y dejar este gate bloqueado en vez de fabricar recibos.

Crear nuevo proyecto real, no reutilizar demo ni sealed plan UNCONFIGURED. Ejecutar create/accept/fund/submit/approve/release y una negativa; getTransaction SUCCESS, ledger, estado y balances antes/después. Las firmas son separadas por rol. Registrar WASM SHA256, contractID y hashes reales. Nunca marcar pagado por la respuesta de send.

### Fase F: entrega

Ejecutar toda la suite tras integración. Probar copia limpia con locks. Actualizar status/docs/README y demo con evidencias reales. Mantener origen de fechas/bases: falta reglamento primario, no afirmar elegibilidad confirmada. Preparar ZIP actualizado sin node_modules/target/.env/.hito/seeds.

## 5. Paralelismo y límites del loop

Puedes delegar: dominio/API/tests; Rust/auth; SDK/wallet; docs/MCP. Interfaces congeladas y un integrador. Por fallo, hasta tres intentos justificados con nueva evidencia; repetir el mismo error dos veces sin progreso requiere otro diagnóstico y reporte, no escalada de permisos. No cambiar criterios de aceptación para pasar ni eliminar checks.

## 6. Condiciones de aceptación del encargo

Un comando ejecutado debe incluir exit code y log. Reporta por separado PASS, FAIL, BLOCKED y NOT_RUN. No «todo completo» si falta firma/Testnet/locks. No «seguro para producción» después de unit tests. No secreto en ZIP/logs/config MCP. No pagos automáticos ocultos.

Entrega al usuario: resumen de cambios, árbol de archivos, pruebas/resultados, versions/locks, transacciones Testnet reales cuando existan, vulnerabilidades/limitaciones pendientes, próximos pasos exactos y ZIP final. Detalla cada gate que no pudiste cerrar y la razón, sin sustituir trabajo por preguntas innecesarias.

## 7. Primer resultado que espero

Un diagnóstico corto de estado y comandos reproducidos, seguido de correcciones concretas y ejecución. No otra propuesta abstracta. Mantén el producto aprobado: TU MODELO PLANEA Y PROGRAMA; HITO REGISTRA EL COMPROMISO Y PREPARA PAGOS AUTORIZADOS.
