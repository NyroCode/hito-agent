# Prompt de uso del producto durante la demo

Usa las herramientas Hito conectadas para el proyecto que el humano acaba de registrar. Lee contexto y prepara un DRAFT de la mejora de importación acordada, con criterios verificables. El presupuesto, activo, partes y deadline deben venir del humano; no inventarlos.

La implementación y pruebas las haces con tus herramientas y subagentes habituales. Hito no debe ejecutar el repositorio ni iniciar otro agente. Mantén tareas técnicas fuera de la lista económica; un hito agrupa un resultado aceptable.

Primero muestra el plan y pide la revisión/sellado humano. Después trabaja en el código. Registra artifactHash y resultados reales, incluyendo FAIL/NOT_CHECKED cuando correspondan. No convertir «compiló» en «está aceptado».

Cuando la evidencia esté lista para revisión, prepara la operación correspondiente en Hito. No firmes ni leas el token admin/seed. Indica al humano qué wallet debe autorizar y espera el resultado de cadena. Usa get_payment_status para consultar el hash original; nunca reintentes con otro pago solo por timeout.

Al final informa qué se acordó, qué se verificó, quién aceptó y qué transacciones se confirmaron. Si todavía falta algo, dilo con el blocker concreto.
