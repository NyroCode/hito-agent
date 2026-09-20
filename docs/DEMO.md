# Demo y requisitos del concurso

Las bases oficiales de Stellar Odyssey Perú se cotejaron el 20-sep-2026 en `https://stellar.mintedinpe.com/bases`. Confirman checkpoint 23-sep-2026 23:59, cierre de entregables 25-sep-2026 23:59 (hora Perú), rúbrica 30/25/20/15/10, equipos de 1–4, y Testnet obligatorio. Proyectos previos son válidos si declaran el commit base y explican la funcionalidad nueva construida dentro de la ventana iniciada el 19-sep-2026. **No se verificaron la inscripción ni la elegibilidad personal del equipo.**

Los cuatro entregables oficiales son: repositorio público con README, video demo funcional sin límite de duración, video pitch de máximo 3 minutos y contrato o transacción comprobable en Stellar Testnet. El video demo y el pitch son piezas distintas.

## Mensaje
«Tu agente transforma un encargo en hitos y desarrolla con sus herramientas habituales. Hito conserva qué se acordó, qué se entregó y qué se puede autorizar a pagar en Stellar».

No afirmar que Hito certifica calidad, programa mejor o resuelve disputas con IA. La originalidad propuesta está en integrar compromiso/evidencia/pago al flujo del agente; escrow por sí solo no es novedoso.

## Video propuesto de tres minutos (adaptar a bases primarias)

0:00–0:25: usuario pide un trabajo, agente invoca Hito y crea plan estructurado.
0:25–0:50: revisar hitos/criterios/precio; pagador y proveedor aceptan; mostrar funding Testnet real.
0:50–1:30: agente ejecuta sus pruebas; evidencia FAIL/NOT_CHECKED produce blocker. No hay falso pago.
1:30–2:15: corrección usando herramientas del host; nueva evidencia; proveedor presenta y cliente firma aceptación.
2:15–2:45: release confirmado; mostrar hash, ledger, estado y balance, no solo botón verde.
2:45–3:00: rechazo del segundo pago y límite de confianza self_reported. No pantallas con secretos.

## Modo local no sustituye la demo Testnet

El seed es ficticio y offline rechaza pagos. Solo utilizarlo para mostrar UI/plan. No editar un screenshot o base local para fingir financiación. Git commit del artefacto evaluado, WASM hash y recibos deben coincidir.

## Reutilización

Crear baseline commit al recibir el ZIP, registrar fecha de generación y qué trabajo continúa durante la ventana autorizada. Declarar este código generado, bibliotecas externas y componentes preexistentes según el reglamento que se obtenga. No adjudicar a un intervalo autorizado trabajo creado antes sin comprobar bases.
