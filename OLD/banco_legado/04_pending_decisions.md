# 04_pending-decisions.md

## Pendências de modelagem

- Validar se `users` entra de fato no MVP com `device_id`/guest flow ou se o vínculo inicial será apenas por instalação no app.
- Validar se `portfolios` precisa permitir múltiplas carteiras por usuário já na V1 ou se a operação real será sempre carteira única.
- Confirmar se `platforms` deve ser catálogo controlado ou apenas texto livre normalizado a partir da importação.
- Confirmar se `asset_types` precisa dos tipos além de `STOCK`, `FUND` e `PENSION` nesta fase inicial.
- Validar se `portfolio_positions` deve representar apenas posição atual operacional ou também servir como espelho persistente da última importação consolidada.
- Validar se `planned_orders` precisa de vínculo obrigatório com `asset_id` ou se deve continuar aceitando ativo textual sem correspondência resolvida.

## Hipóteses não implementadas

- Não foi implementada tabela de `transactions` porque a documentação mais recente prioriza snapshot como fonte principal e não sustenta ledger histórico como parte necessária da primeira versão.
- Não foi implementada estrutura de autenticação completa, sessão, credenciais ou provedores externos.
- Não foi implementada estrutura de filas, controle detalhado de parsing ou estados internos de worker além do necessário para rastrear importações.
- Não foi implementada tabela equivalente a `app_config`, porque o material atual não sustenta com segurança quais chaves continuarão existindo no backend novo nem se esse contrato permanece no D1.
- Não foram implementadas constraints de unicidade mais agressivas em `portfolio_positions`, `planned_orders` e `portfolio_contributions` porque faltam chaves de negócio estáveis no legado.

## Lacunas de documentação

- Falta data mapping consolidado e final entre planilha operacional, BigQuery atual, contrato mobile e schema alvo no D1.
- Falta definição explícita da estratégia de normalização de ativos sem ticker, especialmente fundos, previdência e produtos de renda fixa com nomes livres.
- Falta definição explícita de quais campos continuam obrigatórios na importação do MVP mobile.
- Falta definição operacional de como `status` e `situacao` devem ser padronizados entre domínios.
- Falta definição se datas como `mes_ano`, `data_inicio`, `data_entrada` e `validade` serão persistidas como texto canônico, date-only ou datetime completo em todos os fluxos.
- Falta confirmação de quais campos do motor analítico precisam ser persistidos e quais continuam calculados em tempo de leitura.

## Pontos que precisam de validação antes da próxima versão

- Revisar o repositório de migração quando houver código real de Drizzle/Worker/API para ajustar nomes finais, nulabilidade e possíveis constraints.
- Validar se `portfolio_analyses` e `analysis_insights` cobrem o que o produto realmente quer persistir da IA e do motor de decisão.
- Validar se a camada de compatibilidade com o legado AppScript precisa mesmo de views permanentes ou apenas queries/mapeadores na aplicação.
- Decidir se aliases legados como `qtd`, `entrada`, `inicio`, `plano_fundo` e `total_aportado` continuam sendo responsabilidade do banco ou passam a ser responsabilidade exclusiva da aplicação.
- Confirmar estratégia de soft delete versus delete físico para importações, posições e snapshots.
- Confirmar se haverá necessidade de versionar snapshots por origem de importação, por plataforma ou por carteira consolidada única.
- Validar a necessidade de índices adicionais somente após observar consultas reais do app, do worker de importação e dos fluxos analíticos.

