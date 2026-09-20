# Uso de GitHub Spec Kit en este repositorio

Fuente revisada: https://github.com/github/spec-kit (2026-09-20). Se inspeccionaron README, instalación y templates. No se clonó ni instaló el CLI en este contenedor por falta de salida DNS. Estos specs son autoría de la entrega, organizados según la metodología upstream; no son un resultado ficticio de ejecutar sus comandos.

## Organización preparada

- `.specify/memory/constitution.md`
- `specs/001-hito-agent-native/spec.md`
- `plan.md`, `research.md`, `data-model.md`, `quickstart.md`
- `contracts/` con REST, MCP y ABI
- `tasks.md`, `checklists/requirements.md`

Upstream documenta constitución una vez y Specify → Plan → Tasks → Implement → Converge por feature. Los skills actuales pueden usar nombres con guion; algunas integraciones/modos usan puntos u otra sintaxis. Confirmar lista instalada: son invocaciones en el agente, no shell commands.

## Instalación no destructiva

Revisar release/tag o commit upstream y guardarlo en el informe. No se fija aquí un tag estable que no se verificó. `main` puede ser desarrollo.

```bash
SPEC_KIT_REF=TAG_O_COMMIT_REVISADO SPEC_KIT_INTEGRATION=codex bash scripts/bootstrap-speckit.sh
```

El script instala Specify desde fuente oficial fijada, inicializa una carpeta temporal de staging (ruta impresa por el script) e imprime pasos. Revisar los archivos generados y copiar solo integración/plantillas necesarias, conservando constitución y specs ya existentes. No aplicar `--force` ni eliminar trabajo. Revisar `specify version` y `specify init --help` cuando la versión seleccionada difiera.

## Qué pedirle al agente

Primero comparar los archivos existentes con lo requerido por la versión de Spec Kit. No volver a generar todos los specs. Ejecutar analysis/clarify sobre contradicciones técnicas concretas; no reabrir la decisión «herramienta vs agente».

Después usar tasks para cerrar los IDs pendientes, implement y converge por capa. Un bloqueo de toolchain/red se registra con razón y evidencia, no como aceptación técnica. El prompt detallado está en `../prompts/LOCAL_AGENT_HANDOFF.md`.

La convergencia se alcanza para las pruebas reales del alcance acordado; no mediante loops que cambien criterios para que el código pase. Spec Kit dirige el DESARROLLO de Hito; no es una dependencia del PRODUCTO Hito.
