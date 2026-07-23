# packages/contracts

Contratos canonicos iniciais da fusao.

Arquivos vivos nesta etapa:

- `auth.ts` - sessao, login, cadastro e recover
- `asset.ts` - criacao canonica de ativo no runtime vivo
- `detail.ts` - detalhe do ativo, historico, lifecycle e aportes
- `ai.ts` - analise contextual da carteira/ativo
- `public.ts` - healthcheck e envelopes publicos minimos
- `portfolio.ts` - `PortfolioSummary`, `PortfolioAssetSummary`, alocacao, frescor, quote health e patrimonio bruto
- `history.ts` - historico basico da carteira
- `goods.ts` - bens e patrimonio complementar
- `funds.ts` - busca publica de fundos CVM
- `import.ts` - analise e persistencia do wizard de importacao

Fonte canonica desta primeira versao:

- `src/index.ts`
- `src/cvm.ts`
- `tests/api.spec.ts`
- `migrations/004` a `migrations/011`

Regra:

- nesta fase os contratos descrevem o runtime vivo atual
- nenhuma troca de endpoint ou envelope acontece aqui
- `apps/core-api` deve importar estes contratos antes de expor ou alterar DTOs externos
- tipos internos de SQL, D1 e reconciliacao podem continuar locais enquanto nao vazarem para a borda HTTP
