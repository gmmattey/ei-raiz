# Checklist de Validação Imediata (Produção)

## Pré-requisitos
- API: `https://ei-api-gateway.giammattey-luiz.workers.dev`
- Web: `https://8bf6ca57.ei-raiz-web.pages.dev`
- CSVs: `tests/massa-importacao/csv`

## Fluxos (ordem recomendada)
1. Registro de usuário novo.
2. Login com usuário novo.
3. Onboarding completo.
4. Importação (upload, revisão, confirmação).
5. Home com dados reais.
6. Carteira (filtros + busca).
7. Insights (score/diagnóstico/resumo).
8. Histórico (snapshots/eventos e range).
9. Perfil (leitura e atualização).
10. Logout e bloqueio de rota protegida.

## Casos CSV e resultado esperado

| Arquivo | Esperado (válidos/conflitos/erros) | O que deve acontecer | Impacto esperado |
|---|---:|---|---|
| `01_caso_feliz_simples.csv` | 1/0/0 | Revisão sem erro, confirmação habilitada | Carteira deixa estado vazio |
| `02_multiplos_ativos.csv` | 5/0/0 | Linhas válidas em múltiplas categorias | Home/carteira/insights com base ampla |
| `03_conflitos_ativos_existentes.csv` | 0-3 conflitos* | Conflito em ativos já presentes | Sem duplicar ativo após confirmar |
| `04_ticker_desconhecido.csv` | 0/0/2 | Mensagem: ticker não reconhecido | Confirmação desabilitada se não houver válidos |
| `05_valor_invalido.csv` | 0/0/2 | Mensagem: valor inválido | Não confirma linhas inválidas |
| `06_data_invalida.csv` | 0/0/2 | Mensagem: data inválida | Não confirma linhas inválidas |
| `07_categoria_invalida.csv` | 0/0/2 | Mensagem: categoria inválida | Não confirma linhas inválidas |
| `08_misto_validos_invalidos.csv` | 2/0/3 | Misto de status no mesmo upload | Confirma apenas válidos |
| `09_carteira_pequena.csv` | 2/0/0 | Carteira pequena, pouca diversificação | Insights tendem a score moderado/baixo |
| `10_carteira_concentrada.csv` | 3/0/0 | Forte concentração em poucos ativos | Insights devem apontar concentração |
| `11_carteira_equilibrada.csv` | 6/0/0 | Alocação distribuída entre categorias | Insights tendem a melhora de score |
| `12_arquivo_fora_padrao.csv` | N/A | Erro de arquivo fora do padrão | Upload bloqueado com mensagem clara |

\* Em `03_conflitos_ativos_existentes.csv`, conflito depende de ativos já existentes do usuário.

## Validação de UX mínima
- Upload: erro legível por causa (tipo/padrão/validação).
- Revisão: status visível por linha (válido/conflito/erro).
- Empty states: CTA claro para `/importar`.
- Navegação: sem dead-end após onboarding/importação.

## Smoke técnico mínimo
- `npm run typecheck`
- `npm run build`
- `npm run test -w @ei/servico-autenticacao`
- `npm run test -w @ei/servico-insights`
