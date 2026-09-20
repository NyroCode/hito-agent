# Dependencias y reproducibilidad

Consulta 2026-09-20. No se resolvieron paquetes npm/crates porque el contenedor no tiene DNS de salida; `npm install` terminó EAI_AGAIN. Por tanto, no hay lockfiles ni checksum de dependencias descargadas. Los números fijados son una base de compatibilidad a verificar, no prueba de instalación exitosa.

| Dependencia | Manifest | Base / gate |
|---|---|---|
| Node | >=22.16 | Core probado con 22.16.0; built-in SQLite/strip-types experimentales |
| @stellar/stellar-sdk | 16.0.1 | package.json oficial consultado; ejecutar typings y tests |
| @modelcontextprotocol/sdk | 1.30.0 | rama oficial v1.x consultada; no mezclar SDK v2 |
| @stellar/freighter-api | 6.0.1 | pin candidato; confirmar publicación/API en registro oficial local |
| zod | 3.25.76 | candidato compatible con rango SDK; resolver y fijar lock |
| TypeScript | 5.9.3 | candidato exacto; tsc no ejecutado |
| @types/node | 22.19.17 | candidato exacto; comprobar Node SQLite declarations |
| esbuild | 0.27.7 | candidato exacto; bundle no construido |
| soroban-sdk | 25.1.1 | Cargo workspace upstream consultado; cargo no disponible |
| Spec Kit | sin pin ficticio | escoger release/commit revisado antes del bootstrap |

## Primer trabajo del agente local

1. Registrar versiones de máquina. Revisar manifests y la existencia de versiones en fuentes primarias.
2. Resolver diferencias conservando arquitectura y semántica, no instalar `latest` sin inspección.
3. Ejecutar `npm install`, generar package-lock, inspeccionar scripts/librerías y auditoría. El lifecycle de esbuild puede ser necesario para su binario; revisar antes de habilitar scripts.
4. `npm run check:types`, tests/adapters, build:wallet.
5. `cargo generate-lockfile` sobre workspace, verificar lock y ejecutar fmt/clippy/test/build.
6. Guardar ambos locks. CI usa `npm ci` y cargo --locked una vez existan. No pretender que una instalación sin lock es reproducibilidad completa.

La advisory GHSA-4chv-4c6w-w254 de Soroban SDK motivó evitar versiones anteriores vulnerables para esa incidencia; usar 25.1.1 no es una auditoría general. Revisar advisories de todas las dependencias a la fecha de ejecución.
