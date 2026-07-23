# apps/ingestion-plane

Destino da logica de cron, ingestao e reconciliacao.

Primeiras candidatas a morar aqui:

- BRAPI
- CVM
- benchmarks macro
- snapshots mensais

Estado atual:

- `cvm.ts` ja concentra a implementacao real do pipeline CVM (quotes, funds cache, busca e parsers)
- `brapi.ts` concentra o refresh massivo de cotacoes BRAPI do cron vivo
- `macro.ts` concentra o refresh de benchmarks macro
- `snapshots.ts` concentra o snapshot mensal e o upsert manual por usuario
- `src/cvm.ts` continua como adapter fino do runtime vivo e dos testes locais
- nada foi religado para deploy separado; o Worker principal segue chamando tudo pelo runtime atual
- `src/index.ts` continua apenas como wiring do scheduler e dos endpoints vivos que ainda dependem desses modulos
