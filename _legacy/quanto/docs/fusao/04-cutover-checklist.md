# Fusao Quanto + Esquilo — Cutover Checklist

Atualizado em: 2026-06-19
Uso: checklist de preparacao para a troca real quando a trilha nova tiver paridade
Playbook operacional complementar: `docs/fusao/06-operacao-cutover.md`
Status real nesta data: `36/36` itens fechados

## 1. Regras antes de qualquer cutover

- O runtime atual precisa continuar funcionando ate o ultimo momento.
- Nenhum cutover sem regressao automatizada minima.
- Nenhum cutover sem rollback claro.

## 2. Checklist de arquitetura

- [x] `apps/web` cobre ao menos shell + Hoje + Carteira + Detalhe + Historico
- [x] `apps/core-api` ja concentra os dominios extraidos sem depender de logica espalhada
- [x] `apps/ingestion-plane` tem fronteiras claras para cron e reconciliacao
- [x] `packages/contracts` virou a fonte unica dos DTOs canonicos
- [x] `packages/domain` absorveu calculos puros hoje espalhados
- [x] `packages/ui` concentra tokens/componentes reutilizados

## 3. Checklist de runtime

- [x] `wrangler.toml` foi revisado para o novo wiring
- [x] nenhum secret sensivel ficou hardcoded em `[vars]`
- [x] assets novos podem ser servidos sem quebrar a PWA atual
- [x] cron BRAPI, CVM, macro e snapshots continuam disparando nos horarios esperados
- [x] caminho de rollback do Worker atual foi testado

## 4. Checklist de dados

- [x] inventario do schema real considera `schema.sql` + migrations aplicadas
- [x] views SQL usadas em tela continuam corretas
- [x] dados de importacao/reconciliacao possuem rastreabilidade
- [x] CVM, BRAPI e macro nao perderam cache nem integridade
- [x] bens, aportes e lifecycle preservam historico

## 5. Checklist de paridade funcional

- [x] login, cadastro e recover funcionam
- [x] Hoje entrega o mesmo total, frescor, alocacao e patrimonio bruto
- [x] Carteira preserva agrupamento, filtros e statuses
- [x] Detalhe do ativo preserva grafico, aportes e analise
- [x] Historico preserva snapshots e evolucao
- [x] Importar preserva wizard, revisao e confirmacao
- [x] Bens preserva cadastro, edicao e total bruto
- [x] dark mode continua legivel
- [x] ocultar valores nao vaza numeros
- [x] offline continua exibindo ultimo estado valido

## 6. Checklist de QA

- [x] `npm run typecheck`
- [x] `npm test`
- [x] smoke visual mobile e desktop
- [x] cobrimos ao menos um caso feliz e um negativo para fluxos alterados
- [x] `docs/TEST_PLAN.md` reflete o runtime da trilha nova
- [x] novo relatorio de QA datado foi gerado quando o escopo justificar

## 7. Checklist de operacao

- [x] documentacao de deploy/cutover atualizada
- [x] instrucoes de rollback escritas
- [x] handoff de arquitetura e QA fechados
- [x] `docs/fusao/` atualizada no mesmo commit do cutover

## 8. Gatilhos de bloqueio

Se qualquer item abaixo ocorrer, o cutover para:

- divergencia entre total da Hoje antiga e nova
- regressao em auth
- perda de dados de aportes, bens ou lifecycle
- cron quebrado
- importacao sem paridade minima
- PWA/offline quebrados

## 9. Rollback minimo esperado

- manter o runtime atual em `src/` e `public/` recuperavel
- reverter o ponteiro de assets se `apps/web` falhar
- reverter a composicao da API para `src/index.ts` monolitico se a extracao falhar
- nao aplicar migracoes irreversiveis no mesmo passo do primeiro cutover visual
