# _legacy

Repositórios anteriores do Esquilo Invest/Wallet, consolidados aqui em 2026-07-23 pra reduzir o
número de repos pessoais no GitHub. Nenhum destes roda em produção — o produto ativo é a raiz
deste repositório (`esquilo-wallet`, ex-`ei-raiz`). Histórico de cada um foi importado via
`git subtree` (squash) a partir do repo original, que foi renomeado, arquivado e depois deletado.

| Pasta | Repo original | O que era |
|---|---|---|
| `v1/` | `esquilo-invest` | Gen 1 — dashboard financeiro em Google Apps Script |
| `v2/` | `Esquilo-Invest-2.0` | Gen 2 — Apps Script + BigQuery + MVP Flutter ("Pocket Ops") |
| `bridge/` | `Quebra_Nozes` | Ponte de transição do legado Apps Script pro Cloudflare/D1 (não chegou a virar produto integrado) |
| `vera-insights/` | `vera-insights` | Protótipo standalone da plataforma de IA financeira Vera. Vera foi descontinuada como produto e removida da raiz em 2026-07-26 (ver `documentacao/consolidacao/AUDITORIA_CONSOLIDACAO_PRODUTO_UNICO.md` §11.6) |
| `quanto/` | `Quanto` (nunca publicado no GitHub, só clone local) | Consolidação de patrimônio pessoal — produto separado do Esquilo Invest/Wallet, mas mesmo domínio (patrimônio, ativos, importação). Fora do foco 7ALabs desde 2026-07-10 |

Cada pasta preserva a estrutura interna do repo original. Não há build/CI configurado pra nada
aqui dentro — é referência histórica, não código ativo.

## Congelado (2026-07-26)

O inventário item a item dos cinco legados acima está completo — ver
`documentacao/consolidacao/AUDITORIA_CONSOLIDACAO_PRODUTO_UNICO.md` §11 (issue #115, fechada).

**Esta pasta é somente leitura a partir daqui.** Nenhum arquivo dentro de `_legacy/` deve ser
editado, movido ou ter conteúdo novo adicionado — mudanças aqui só devem acontecer por engano ou
para extrair algo pontual já classificado como "Pendente" no inventário (nesse caso, o código nasce
de novo na raiz, não é editado aqui). Se uma PR tocar em `_legacy/`, é sinal de alerta: revisar com
atenção antes de aprovar.
