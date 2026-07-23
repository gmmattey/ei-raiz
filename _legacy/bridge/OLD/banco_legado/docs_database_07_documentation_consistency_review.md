# Revisão de consistência da documentação

## Inventário dos documentos revisados

Foram considerados nesta revisão os documentos e artefatos já produzidos para a nova base e para a transição do legado:

- `01_schema.sql`
- `02_indexes.sql`
- `03_compatibility_views.sql`
- `04_pending-decisions.md`
- `docs/database/05-how-to-create-d1-database-for-beginners.md`
- `docs/database/06-codex-integration-and-appscript-adaptation.md`
- documentação técnica e de contexto do projeto atual usada como base de sustentação
- materiais anteriores sobre modelo alvo, migração progressiva, compatibilidade com legado e direção Cloudflare/D1

## Inconsistências encontradas

### 1. Papel do D1 estava claro, mas a hierarquia documental ainda não estava explícita

Problema:

- os documentos já apontavam o D1 como destino estruturante
- porém a ordem de autoridade entre schema, pendências, views, guia operacional e integração ainda não estava registrada de forma única

Impacto:

- aumenta risco de o Codex usar documento secundário como se fosse fonte principal
- aumenta interpretação subjetiva em caso de conflito futuro

### 2. Compatibilidade com legado estava descrita, mas precisava ser tratada como transitória

Problema:

- os documentos já sustentavam views de compatibilidade e preservação de contrato legado
- porém era necessário reforçar que isso é mecanismo de transição, não modelo definitivo

Impacto:

- risco de o Codex perpetuar estrutura herdada sem necessidade
- risco de transformar compatibilidade temporária em regra permanente

### 3. Pendências e integração já estavam razoavelmente alinhadas, mas faltava amarrar melhor o que é seguro executar agora

Problema:

- `04_pending-decisions.md` lista bem as incertezas
- `06-codex-integration-and-appscript-adaptation.md` orienta a migração progressiva
- mas faltava um ponto consolidado dizendo o que o Codex já pode fazer com segurança e o que ainda exige validação humana

Impacto:

- risco de implementação apressada em áreas ainda abertas
- desperdício de tempo do Codex tentando resolver lacunas não fechadas

### 4. Guia operacional do D1 precisava ser lido em conjunto com os scripts, e não como documento isolado

Problema:

- o guia de criação do banco está adequado para leigos
- mas seu uso correto depende de obedecer estritamente a ordem dos scripts aprovados

Impacto:

- risco de execução fora de ordem
- risco de o usuário usar o guia sem compreender quais arquivos são obrigatórios e quais são opcionais

### 5. Há pendência estrutural real de data mapping consolidado

Problema:

- a documentação já reconhece que o data mapping final ainda não está completamente fechado
- isso continua sendo a principal lacuna entre modelo alvo, contratos legados e implementação futura

Impacto:

- o Codex pode avançar com parte da implementação
- mas não deve consolidar migração completa de todos os fluxos sem validação adicional

## Ajustes realizados

### Ajuste 1. Padronização da hierarquia documental

Foi consolidada a seguinte hierarquia de referência para execução pelo Codex:

1. schema SQL aprovado
2. data mapping validado
3. modelo de dados alvo
4. estratégia de integração/adaptação
5. guia operacional de criação do banco
6. pendências documentadas

Motivo:

- reduz ambiguidade
- evita que documento secundário prevaleça sobre estrutura aprovada
- melhora previsibilidade da implementação

### Ajuste 2. Consolidação da leitura de compatibilidade como camada transitória

Foi consolidado nesta revisão que:

- views de compatibilidade são auxiliares
- não são fonte principal de verdade
- só devem existir para reduzir impacto no legado enquanto a migração progride

Motivo:

- evitar fossilização do contrato legado
- manter o D1 como base estruturante real

### Ajuste 3. Consolidação do critério de segurança para o Codex

Foi consolidado que o Codex:

- já pode atuar com segurança sobre schema, índices, ordem operacional de criação do banco e desenho geral da adaptação progressiva
- ainda não deve assumir fechamento definitivo de data mapping, desligamento do legado ou substituição completa de BigQuery/planilha sem validação humana

Motivo:

- separar execução segura de áreas ainda abertas
- reduzir decisões prematuras

## Pontos ainda pendentes

- data mapping final entre planilha operacional, BigQuery atual, contrato mobile e schema D1
- definição final de quais fluxos entram primeiro na migração real
- decisão sobre quanto da compatibilidade ficará no banco e quanto ficará na aplicação
- estratégia final de autenticação/acesso entre AppsScript e nova camada de dados
- critério objetivo para desligamento progressivo de BigQuery e planilha

## Riscos residuais

- risco de o Codex avançar em fluxos cuja compatibilidade ainda depende de mapping não validado
- risco de manter legado por tempo demais e aumentar custo de manutenção
- risco de divergência entre o schema aprovado e adaptações futuras feitas sem seguir a hierarquia documental
- risco de views de compatibilidade ganharem papel maior do que deveriam
- risco de a nova camada de comunicação ficar confusa se leitura, escrita e adaptação não forem separadas com clareza

## Avaliação final sobre o nível de prontidão da documentação para uso pelo Codex

A documentação está em bom nível para orientar:

- criação inicial do banco D1
- uso ordenado dos scripts SQL
- leitura do papel do D1 como base estruturante
- desenho da adaptação progressiva do AppsScript
- entendimento de que a migração não deve ser feita por reescrita total agora

A documentação ainda não está em nível totalmente fechado para:

- migração completa de todos os fluxos operacionais
- substituição total do legado
- definição final de todos os contratos de leitura e escrita sem validação humana adicional

## Prontidão para uso pelo Codex

### O que o Codex já pode executar com segurança

- criação do banco D1 a partir dos scripts aprovados
- execução ordenada de `01_schema.sql`, `02_indexes.sql` e `03_compatibility_views.sql` quando aplicável
- implementação inicial de camada de acesso preparada para o D1
- mapeamento de dependências reais do AppsScript
- adaptação incremental de fluxos prioritários de leitura e escrita
- manutenção de compatibilidade transitória com o legado sem redefinir o modelo de dados

### O que o Codex ainda não deve executar sem validação humana

- substituição total de BigQuery e planilha
- desligamento definitivo de compatibilidades legadas
- fechamento de data mapping ainda não validado
- consolidação de autenticação/acesso ainda não definida
- refatoração estrutural ampla do AppsScript além do necessário para a transição atual

### Quais documentos devem ser considerados fonte principal de verdade

- `01_schema.sql` como fonte principal da estrutura aprovada do banco
- data mapping validado como segunda fonte de verdade quando estiver consolidado
- `docs/database/06-codex-integration-and-appscript-adaptation.md` como guia principal da transição entre legado e nova base
- `docs/database/05-how-to-create-d1-database-for-beginners.md` como guia operacional de criação do banco
- `04_pending-decisions.md` como registro oficial do que ainda não deve ser tratado como fechado

### Em caso de conflito futuro, qual hierarquia documental deve ser seguida

1. schema SQL aprovado
2. data mapping validado
3. modelo de dados alvo
4. estratégia de integração/adaptação
5. guia operacional de criação do banco
6. pendências documentadas

