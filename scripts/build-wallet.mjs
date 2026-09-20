import { build } from 'esbuild';
await build({entryPoints:['src/wallet/entry.ts'],outfile:'public/wallet.bundle.js',bundle:true,platform:'browser',format:'esm',target:'es2022',sourcemap:false,minify:true});
console.log('Freighter bundle built locally. No CDN runtime dependency.');
