# Esquilo Wallet — Instruções para Agentes

Este arquivo é a fonte canônica de instruções operacionais para agentes que trabalham neste
repositório. As regras se aplicam à raiz e a todo o código ativo, salvo quando existir um
`AGENTS.md` mais específico em algum subdiretório.

## 1. Produto

Esquilo Wallet é uma plataforma brasileira de consolidação patrimonial, diagnóstico de risco e
inteligência financeira.

Stack principal:

- Frontend: React + Vite, publicado no Cloudflare Pages.
- Backend: TypeScript em Cloudflare Workers.
- Banco: Cloudflare D1, compatível com SQLite.
- Contratos: tipos TypeScript compartilhados por npm workspaces.
- Infraestrutura: Cloudflare Workers, Pages e GitHub Actions.

O código ativo está na raiz do monorepo. A pasta `_legacy/` contém somente referências históricas.

## 2. Fontes de verdade

Antes de implementar qualquer mudança, consulte apenas as fontes necessárias:

1. `AGENTS.md`: regras operacionais e definição de pronto.
2. `README.md`: estrutura, ambiente e comandos atuais.
3. `CLAUDE.md`: arquitetura detalhada, domínios, banco e integrações.
4. `documentacao/produto/`: comportamento funcional aprovado.
5. `documentacao/arquitetura/`: decisões e restrições técnicas.
6. `documentacao/marca/`: identidade e design system vigente.
7. Issue em execução: escopo, comportamento e critérios de aceite.

Em caso de conflito:

1. Instrução explícita do usuário.
2. Issue aprovada mais recente.
3. Código ativo e migrations atuais.
4. `AGENTS.md`.
5. Documentação do produto e arquitetura.
6. Documentação histórica.

Não use `_legacy/` como fonte de verdade do produto atual.

## 3. Estrutura do código ativo

```text
apresentacao/             Frontend React + Vite
servidores/porta-entrada/ Backend Cloudflare Worker
bibliotecas/contratos/    DTOs e tipos compartilhados
bibliotecas/utilitarios/  Funções internas reutilizáveis
bibliotecas/validacao/    Schemas de validação
infra/banco/migrations/   Migrations versionadas do D1
infra/banco/seed.sql      Dados de desenvolvimento
utilitarios/scripts/      Scripts operacionais
testes/                   Testes E2E e massas de teste
documentacao/             Produto, arquitetura e marca
midia/                    Assets visuais
_legacy/                  Histórico congelado e somente leitura
```

## 4. Regra absoluta para `_legacy/`

A pasta `_legacy/` é somente leitura.

Não:

- edite, renomeie, mova ou remova arquivos de `_legacy/`;
- importe código de `_legacy/` no runtime ativo;
- execute builds ou dependências encontradas dentro de `_legacy/`;
- trate documentação legada como requisito vigente;
- crie novos arquivos dentro de `_legacy/`.

Quando uma funcionalidade histórica precisar ser recuperada, reimplemente-a no código ativo,
adaptada à arquitetura atual. Uma alteração inesperada em `_legacy/` deve ser tratada como erro.

## 5. Fluxo obrigatório de execução

Ao receber uma issue ou tarefa de implementação:

1. Leia esta instrução e a issue integralmente.
2. Inspecione o código relacionado antes de propor mudanças.
3. Verifique se a funcionalidade já existe total ou parcialmente.
4. Identifique contratos, banco, API, frontend e testes afetados.
5. Monte um plano curto para trabalhos com mais de uma camada.
6. Implemente somente o escopo solicitado.
7. Crie ou atualize testes relevantes.
8. Execute as verificações aplicáveis.
9. Revise o diff completo.
10. Compare o resultado com cada critério de aceite.
11. Atualize a documentação afetada.
12. Abra um PR vinculado à issue.

Não encerre uma implementação apenas porque o código foi escrito.

## 6. Autonomia

O agente pode decidir sozinho:

- organização interna de uma implementação já especificada;
- nomes técnicos coerentes com as convenções existentes;
- criação e atualização de testes;
- correções necessárias para build, typecheck ou testes passarem;
- pequenas refatorações locais indispensáveis para a alteração;
- atualização de documentação diretamente afetada;
- tratamento consistente dos estados de carregamento, vazio, erro e sucesso.

O agente deve parar e pedir decisão quando houver:

- mudança de escopo funcional;
- nova regra de negócio não descrita;
- alteração relevante da arquitetura;
- nova dependência externa ou serviço pago;
- mudança de identidade, posicionamento ou jornada do produto;
- decisão sobre cobrança, assinatura ou monetização;
- operação destrutiva em dados;
- migration irreversível;
- alteração de segredo, token ou credencial;
- publicação ou deploy manual em produção;
- conflito entre issue, documentação e comportamento atual.

Não transforme uma dúvida de produto em decisão técnica escondida.

## 7. Regras de domínio e nomenclatura

### Banco de dados

- Tabelas em `snake_case` e no plural.
- Colunas em `snake_case`.
- Chaves estrangeiras terminam em `_id`.
- Timestamps terminam em `_em`.
- Percentuais terminam em `_pct`.
- Valores monetários em reais terminam em `_brl`.
- JSON termina em `_json` e exige justificativa.
- Hashes terminam em `_hash`.
- Booleanos usam `eh_`, `esta_` ou `_ativo`.
- Toda FK deve declarar explicitamente o comportamento `ON DELETE`.
- Toda coluna `usuario_id` deve possuir FK com `ON DELETE CASCADE`.
- Mudança de schema exige migration versionada.
- Nunca altere migration já aplicada para simular uma migration nova.

### TypeScript

- Variáveis e DTOs em `camelCase`.
- Tipos e interfaces em `PascalCase`.
- Sufixos permitidos: `Entrada`, `Saida`, `Filtro`, `Resumo` e `Dto`.
- Contratos compartilhados ficam em `bibliotecas/contratos/`.
- Conversão `snake_case` para `camelCase` ocorre exclusivamente no repositório de persistência.
- Evite `any`; quando inevitável, documente o motivo.
- Não duplique tipos equivalentes entre frontend e backend.

### Vocabulário canônico

Use:

- `patrimonio`;
- `ativos`;
- `patrimonio_itens`;
- `historico_mensal`;
- `perfil`;
- `score`;
- `resumo`.

Não introduza como domínio:

- `portfolio`;
- `carteira`;
- `financial-core`;
- `insights`;
- `analytics`;
- `assets`;
- `posicoes`;
- `snapshot`;
- `unified`;
- nomes com `_v2`.

Textos visíveis podem usar termos aprovados pela especificação de produto, mas o domínio técnico
deve permanecer canônico.

### Rotas HTTP

- URLs em `kebab-case`.
- Prefixo `/api/<dominio>/`.
- Use os verbos HTTP corretamente.
- Não coloque ações como `/criar` ou `/atualizar` no caminho.
- Valide entradas antes de chamar serviços.
- Retorne erros no formato já adotado pela API.

## 8. Camadas do backend

### `*.rotas.ts`

Pode:

- validar entrada;
- resolver autenticação e autorização;
- chamar serviços;
- formatar respostas HTTP.

Não pode:

- executar SQL;
- conter regra de negócio;
- chamar serviços externos diretamente.

### `*.servico.ts`

Pode:

- orquestrar regras de negócio;
- chamar repositórios;
- chamar provedores;
- chamar cálculos puros.

Não pode:

- executar SQL diretamente;
- conhecer detalhes HTTP da rota.

### `*.repositorio.ts`

Pode:

- executar SQL;
- mapear linhas do banco para DTOs.

Não pode:

- conter regra de negócio;
- chamar HTTP externo.

### `calculos/*.ts`

- Deve conter funções puras.
- Não pode acessar banco, rede, relógio global ou filesystem diretamente.

### `provedores/*.ts`

- Pode integrar APIs externas.
- Não pode acessar banco diretamente.
- Deve tratar timeout, indisponibilidade e resposta inválida.

### `jobs/*.ts`

- Deve apenas orquestrar serviços.
- Não deve duplicar regra de negócio.

## 9. Frontend e UX

Para alterações de tela:

- siga os tokens e componentes existentes;
- reutilize componentes antes de criar variantes novas;
- preserve responsividade;
- considere desktop e mobile;
- implemente carregamento, vazio, erro e sucesso quando aplicáveis;
- não apresente dados simulados como reais;
- não esconda erro de API silenciosamente;
- preserve acessibilidade de teclado, foco, rótulos e contraste;
- não introduza cores, fontes ou espaçamentos fora do design system sem justificativa;
- inclua evidência visual no PR quando o layout mudar.

Documentos antigos de design podem estar desatualizados. Confirme a implementação atual e a issue
antes de seguir um documento histórico cegamente.

## 10. Segurança e privacidade financeira

- Nunca registre token, senha, JWT ou dado financeiro sensível em logs.
- Nunca faça commit de `.env`, `.dev.vars`, chaves ou credenciais.
- Não exponha stack trace interno ao frontend.
- Toda consulta de dado privado deve estar vinculada à sessão autenticada.
- Operações por ID devem validar que o recurso pertence ao usuário autenticado.
- Valores financeiros devem preservar precisão adequada e regras de arredondamento existentes.
- Não use números em ponto flutuante de maneira que introduza erro financeiro silencioso.
- Mudanças em autenticação, recuperação de senha ou autorização exigem testes específicos.

## 11. Banco e migrations

Toda mudança de banco deve:

1. criar migration nova em `infra/banco/migrations/`;
2. ser compatível com D1/SQLite;
3. preservar os dados existentes;
4. definir comportamento de rollback ou explicar por que não é viável;
5. atualizar repositórios, contratos e testes afetados;
6. evitar dependência de migration manual não documentada.

O agente não pode aplicar migrations remotamente nem alterar dados de produção sem autorização
explícita.

## 12. Comandos oficiais

Instalação:

```bash
npm ci
```

Desenvolvimento:

```bash
npm run dev
npm run dev:api
npm run dev:all
```

Verificações:

```bash
npm run typecheck
npm run test:api
npm run build
```

Scripts operacionais:

```bash
npm run ingest:cvm
npm run backfill:cvm-monthly
```

Deploy:

```bash
npm run deploy:web
npm run deploy:api
```

Comandos de deploy não devem ser executados automaticamente em tarefas comuns.

## 13. Verificação proporcional

### Documentação apenas

- revisar links e caminhos citados;
- conferir consistência com o código atual;
- confirmar que não houve alteração acidental fora da documentação.

### Frontend

Execute, no mínimo:

```bash
npm run typecheck
npm run build -w @ei/web
```

Quando houver testes diretamente relacionados, execute-os também.

### Backend

Execute, no mínimo:

```bash
npm run typecheck
npm run test:api
```

### Contratos compartilhados

Execute:

```bash
npm run typecheck
npm run build
npm run test:api
```

### Banco, autenticação ou regra financeira

Execute:

```bash
npm run typecheck
npm run test:api
npm run build
```

Crie testes específicos para o comportamento alterado.

### Alteração transversal

Execute a validação completa:

```bash
npm run typecheck
npm run test:api
npm run build
```

Se uma verificação não puder ser executada, explique no PR o motivo e o risco. Não escreva apenas
“não testado”.

## 14. Critério de pronto

Uma tarefa só está pronta quando:

- o comportamento solicitado foi implementado;
- todos os critérios de aceite foram conferidos;
- o escopo não contém mudanças estranhas à tarefa;
- tipos, build e testes aplicáveis passaram;
- não existem segredos ou logs sensíveis no diff;
- contratos e migrations estão coerentes;
- documentação afetada foi atualizada;
- estados relevantes de UI foram tratados;
- o diff foi revisado;
- o PR está vinculado à issue;
- limitações restantes estão registradas.

## 15. Commits e pull requests

- Não trabalhe diretamente na `master`.
- Use uma branch específica para a issue.
- Prefira commits pequenos e coerentes.
- Não misture limpeza geral com implementação funcional.
- Não faça merge automaticamente.
- Não force push em branch compartilhada.
- Não altere histórico publicado.

Formato recomendado de branch:

```text
feat/<issue>-descricao-curta
fix/<issue>-descricao-curta
docs/<issue>-descricao-curta
chore/<issue>-descricao-curta
```

Formato recomendado de commit:

```text
feat(escopo): descrição
fix(escopo): descrição
docs(escopo): descrição
test(escopo): descrição
chore(escopo): descrição
```

O corpo do PR deve informar:

- problema resolvido;
- solução aplicada;
- arquivos ou camadas afetadas;
- validações executadas;
- critérios de aceite atendidos;
- evidências visuais;
- riscos e limitações;
- issue relacionada.

## 16. Uso de subagentes

Subagentes são permitidos quando o trabalho puder ser dividido de forma independente.

Boas utilizações:

- mapear código e dependências;
- revisar segurança;
- verificar cobertura de testes;
- comparar issue com implementação;
- investigar documentação externa;
- revisar frontend e backend separadamente.

Evite:

- vários agentes editando os mesmos arquivos;
- delegação para tarefas pequenas;
- dividir uma decisão de produto entre agentes;
- usar subagentes apenas para parecer que houve mais trabalho.

Para alterações grandes, prefira:

1. um agente explorador em modo somente leitura;
2. o agente principal implementando;
3. um agente revisor em modo somente leitura.

## 17. Proibições

Não:

- edite `_legacy/`;
- faça deploy sem autorização explícita;
- faça merge automático;
- crie requisitos não aprovados;
- adicione serviço pago sem aprovação;
- desative testes para fazer a CI passar;
- use mocks em produção;
- trate falha silenciosamente;
- altere dados de produção;
- inclua segredos;
- reescreva documentação histórica para fingir que sempre esteve correta;
- marque uma tarefa como concluída sem validar o resultado.
