# Constitución Hito

Versión 1.0.0 · Adoptada para esta entrega: 2026-09-20.

## I. Herramienta, no agente sustituto
El razonamiento y los cambios de código pertenecen al agente del usuario. Hito expone operaciones deterministas. Un mismo motor utiliza datos diferentes por proyecto. Invocación explícita; sin auto-mejora ni modificación automática de repositorios.

## II. Acuerdo antes que pago
El trabajo es un borrador editable hasta sellarse. Importe, token, partes, red, criterios, dependencias y fecha se comprometen juntos. Los cambios posteriores no pueden modificar una obligación ya financiada en silencio. Esta versión exige un nuevo trabajo y resolución explícita del anterior; no implementa amendment in-place.

## III. Separación de autoridad
El token del agente no firma. El proveedor acepta los términos y presenta la entrega; el pagador financia y aprueba. La liberación posterior es programada hacia un destino inmutable. Las credenciales de API no equivalen a identidad de wallet ni a consentimiento legal.

## IV. Evidencia honesta
PASS declarado no es verificación independiente. Cada entrega identifica un artefacto y el acuerdo. FAIL, NOT_CHECKED y falta de procedencia tienen semántica distinta. No se inventan ejecuciones, hashes de transacciones o porcentajes de cobertura.

## V. Seguridad económica
Solo Testnet en aplicación/adapter/scripts. Montos i128 positivos en unidades enteras, suma exacta, autorización Soroban, protección de doble liberación y reintentos persistentes. Un estado RPC incierto nunca autoriza nuevo pago. Token de despliegue inmutable; sin función de barrido administrativo.

## VI. Simplicidad y reproducibilidad
Un backend local y una base SQLite son suficientes para el MVP. Código de dominio probado sin red. Protocolo, wallet y cadena tienen gates propios. No exponer local demo como servicio cloud sin OAuth, TLS, aislamiento y auditoría.

## VII. Aceptación del desarrollo
Cada implementación debe demostrar FR relevantes, pruebas negativas y una limitación explícita donde falte evidencia. Verificación bloqueada no equivale a éxito. Converge solo se cierra para el alcance efectivamente verificado.

## Gobierno
Cambiar esta constitución requiere una decisión registrada, impacto en specs, plan, tests y contratos. Prioridad: última instrucción del usuario → esta constitución → especificación → plan → código. Las bases originales de hackathon se deben obtener antes de afirmar elegibilidad; el adjunto es una investigación secundaria.
