# Integração de mercado (F3.6 / #46)

## Fonte usada por tipo de ativo

- `acao` (ações, ETFs, FIIs, BDRs): `brapi` via `GET /api/quote/{ticker}`.
- `fundo`: `CVM` via base cadastral pública (`cad_fi.csv`) por `CNPJ`.
- `previdencia` e `renda_fixa`: sem fonte externa nesta etapa (fallback seguro).

## Estratégia de cache

- Tabela D1: `cotacoes_ativos_cache`.
- Chave: `(fonte, chave_ativo)`.
- TTL:
- bolsa (`brapi`): 10 minutos.
- fundos (`CVM`): 18 horas.
- Em falha externa:
- reutiliza último cache disponível;
- marca status como `atrasado` ou `indisponivel`;
- nunca interrompe resposta da API.

## Cálculo aplicado

- `valorAtual = precoAtual * quantidade` (quando há preço válido).
- `ganhoPerda = valorAtual - (precoMedio * quantidade)`.
- `ganhoPerdaPercentual = ganhoPerda / (precoMedio * quantidade) * 100`.
- Quando não há preço válido, preserva `valor_atual` já armazenado.

## Limitações atuais

- Para `fundo`, a integração CVM nesta fase usa cadastro oficial (identificação), sem cota diária consolidada.
- `previdencia` e `renda_fixa` ainda sem provedor externo dedicado.
