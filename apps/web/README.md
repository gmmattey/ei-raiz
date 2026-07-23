# apps/web

Shell ativo da fusao.

Entregue nesta sessao:

- `index.html` - shell inicial da nova experiencia
- `app.js` - shell funcional da trilha nova com `Hoje`, `Carteira`, `Detalhe`, `Historico`, `Importar` e `Bens`
- `sw.js` - cache de shell restrito a `apps/web` para recarga offline
- `manifest.json` - manifesto proprio da trilha nova, com `start_url` relativo para funcionar em preview e em cutover
- `icons/` - icones PWA sincronizados de `public/icons` para a trilha nova nao depender do legado
- `runtime-ui/` - copia runtime-local de `packages/ui` para o modo buildless de cutover
- `runtime-fonts/` - fontes trazidas de `public/fonts` para a trilha nova conseguir subir so com `apps/web`
- `template-quanto.xlsx` - template local da trilha nova para nao depender de `public/` no cutover
- consumo direto do runtime vivo via `/api/auth/login`, `/api/portfolio`, `/api/history`, `/api/assets/*`, `/api/import`, `/api/goods`, `/api/funds/search` e `/api/ai/analyze`
- fallback local para ultimo estado valido de `portfolio/history/goods/detail` quando a API estiver offline

Importante:

- `apps/web` esta ativo no Worker principal
- para visualizacao local segura, ainda pode servir a raiz do repo estaticamente e abrir `/apps/web/index.html`
- se precisar apontar para outro origin da API, use `?apiBase=http://127.0.0.1:8787`
- para manter `runtime-ui/`, `runtime-fonts/`, `icons/` e `template-quanto.xlsx` sincronizados, rode `npm run sync:web-runtime-assets`
- para validar o modo do Worker servindo `apps/web` na raiz, rode `npm run test:cutover-worker`
- para validar a URL ja promovida, rode `npm run test:cutover-postflight -- --base-url <url>`
