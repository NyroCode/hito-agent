# Dependencias y reproducibilidad

Consulta y resolución local: 2026-09-20. Las publicaciones candidatas se comprobaron en el registro npm, `npm install` generó `package-lock.json` v3 y la integración se validó con Node 24.18.0/npm 11.16.0. La auditoría inicial encontró incidencias transitivas en `@stellar/stellar-sdk@16.0.1`/Axios y una incidencia baja en `esbuild@0.27.7`; se actualizaron los pines explícitos a versiones publicadas corregidas y la auditoría posterior quedó en 0 vulnerabilidades conocidas. Esto no sustituye una revisión de cadena de suministro.

| Dependencia | Manifest | Base / gate |
|---|---|---|
| Node | >=22.16 | Core reproducido con 24.18.0; built-in SQLite/strip-types siguen sujetos al runtime |
| @stellar/stellar-sdk | 16.3.0 | actualizado por advisories de Axios; typings y tests de adapter ejecutados |
| @modelcontextprotocol/sdk | 1.30.0 | publicación estable v1 verificada; handshake y siete tools probados |
| @stellar/freighter-api | 6.0.1 | publicación estable verificada; bundle construido; extensión real es gate separado |
| zod | 3.25.76 | resuelto y fijado por lock |
| TypeScript | 5.9.3 | `tsc --noEmit` ejecutado |
| @types/node | 22.19.17 | resuelto y compatible con el tipado actual |
| esbuild | 0.28.2 | actualizado por advisory; bundle construido |
| soroban-sdk | 25.1.1 | `Cargo.lock` generado; fmt/clippy/31 tests/build WASM ejecutados |
| Spec Kit | v1.0.8 / `0cc9a6a1159471a3108b9bad718ba17006dd6039` | tag y commit verificados; no se aplicó `init --force` |

## Evidencia local y próximos pasos

Los logs exactos de instalación, auditoría, tipado, adapters, bundle, Chromium y Rust están en `reports/local-20260920T190853Z`. El target `wasm32v1-none` se instaló en una toolchain Rust 1.98.1 aislada bajo `/tmp`; no se cambió la instalación global. El WASM resultante tiene SHA-256 `cf6e80562e77de322d9c2e5c7b67a6c91f7788147d21dda91e8fed6eab27ca51`.

La advisory GHSA-4chv-4c6w-w254 de Soroban SDK motivó evitar versiones anteriores vulnerables para esa incidencia; usar 25.1.1 no es una auditoría general. El warning de npm 11 sobre el `postinstall` de esbuild se registró explícitamente; no se ejecutó un `audit fix --force`.
