# Prompts backend do Esquilo Invest para Codex

Este pacote foi feito para conduzir a migração do backend do Esquilo Invest para **Cloudflare Workers + Cloudflare D1**, tratando o **Apps Script como legado congelado**.

Regra central para todos os prompts:
- o Apps Script deve ser tratado apenas como referência histórica de contrato, fluxo e regra de negócio
- a nova versão não deve depender de `google.script.run`, `SpreadsheetApp`, `PropertiesService`, `HtmlService`, `CacheService` nem runtime Google
- a nova base deve nascer orientada a **Cloudflare Workers + D1 + R2**, com separação clara entre leitura operacional, importação, snapshots, análise e contexto do usuário

Ordem sugerida de execução no Codex:
1. `01_arquitetura_alvo_cloudflare.md`
2. `02_schema_d1_sql.md`
3. `03_workers_api_base.md`
4. `04_importacao_normalizacao_deduplicacao.md`
5. `05_dashboard_read_model.md`
6. `06_analise_e_recomendacao.md`
7. `07_snapshots_historico.md`
8. `08_contexto_usuario_perfil.md`
9. `09_dados_externos_cache_referencias.md`
10. `10_compatibilidade_legado_e_migracao.md`
11. `11_testes_observabilidade_endurecimento.md`

Saídas esperadas do conjunto:
- arquitetura alvo do backend novo
- schema relacional inicial em D1
- SQL com tabelas, campos, tipos, índices e constraints mínimas
- rotas HTTP do Worker
- contrato de payload para Home, Carteira, Radar, Perfil, Histórico e Importação
- pipeline de importação com preview, normalização e deduplicação
- snapshots e histórico de carteira
- camada de análise e recomendação desacoplada do legado
- plano de convivência temporária com o Apps Script sem acoplar a nova versão a ele
