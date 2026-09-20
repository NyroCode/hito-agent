# Fixtures y plantillas

`plan.template.json` es un ejemplo ficticio: reemplazar deadline por Unix seconds válido dentro del año, presupuesto y criterios por decisiones reales. Nunca implica precio aceptado.

`testnet-receipts.template.json` comienza NOT_RUN y con null. No completar con IDs inventados ni confundir un receipt local con estado de Stellar.

El seed de `scripts/seed.ts` utiliza direcciones sintéticas solo local y no contiene wallet secret. Los fixtures de tests viven exclusivamente en tests/.
