# Como criar o banco no Cloudflare D1 usando o script do projeto

## Objetivo deste guia

Explicar de forma simples como criar o banco no Cloudflare D1 e rodar o script SQL gerado para este projeto.

## Antes de começar

Antes de fazer qualquer coisa, confirme estes pontos:

- você tem uma conta no Cloudflare e consegue entrar no painel
- você está no projeto certo, conta certa e ambiente certo
- você já tem acesso ao arquivo do script SQL principal do projeto
- você sabe onde está o arquivo `01_schema.sql`
- se também for criar índices e views depois, tenha separados os arquivos `02_indexes.sql` e `03_compatibility_views.sql`

Cuidados importantes:

- não faça isso em uma conta errada do Cloudflare
- não crie o banco em um ambiente de produção sem ter certeza
- não misture scripts de projetos diferentes
- não execute arquivos fora da ordem

Se existir ambiente de teste e ambiente de produção, use primeiro o ambiente de teste.

## O que é o D1, em palavras simples

O D1 é o banco de dados do Cloudflare.

Em palavras simples, ele é o lugar onde as tabelas e os dados do sistema ficam guardados.

Neste projeto, ele está sendo usado para guardar a estrutura principal do banco em um serviço nativo da própria Cloudflare, sem depender de um banco separado instalado por fora.

Você não precisa entender banco de dados a fundo para seguir este guia.
O importante aqui é:

- criar o banco
- abrir a área correta
- colar o script certo
- executar na ordem correta
- conferir se deu certo

## Caminho mais simples: criando pelo painel do Cloudflare

### 1. Entrar no painel do Cloudflare

- acesse o painel do Cloudflare
- faça login na conta correta
- depois de entrar, fique na tela principal do painel

### 2. Localizar o D1

No menu lateral do Cloudflare, procure a área de armazenamento e banco.
Dependendo da interface, o D1 pode aparecer dentro de uma seção relacionada a desenvolvedores, banco ou storage.

O objetivo é encontrar a área onde aparecem os bancos D1.

Se tiver dúvida, use a busca interna do painel e pesquise por `D1`.

### 3. Criar um novo banco

Quando estiver na área do D1:

- clique na opção para criar novo banco
- normalmente aparece algo como **Create database** ou equivalente

### 4. Dar nome ao banco

Escolha um nome claro.
Exemplos:

- `esquilo-invest-dev`
- `esquilo-invest-hml`
- `esquilo-invest-prod`

Use um nome que deixe claro se é teste, homologação ou produção.

Evite nomes genéricos como:

- `teste`
- `banco1`
- `novo`

### 5. Observar localização ou jurisdição, se aparecer

Em alguns casos, o painel pode mostrar opções extras como localização ou jurisdição.

Para este passo inicial:

- só altere isso se o projeto já tiver uma definição clara sobre isso
- se ninguém tiver definido nada, não invente escolha técnica sozinho
- na dúvida, use a opção padrão do projeto ou a orientação do time responsável

### 6. Abrir o banco criado

Depois que o banco for criado:

- clique no nome do banco
- abra a tela de detalhes dele

Você precisa chegar na área onde seja possível executar comandos SQL.

### 7. Abrir o console SQL

Dentro do banco criado, procure a área de consulta ou execução de SQL.

Normalmente haverá algo como:

- console SQL
- query
- query editor
- run SQL

Essa é a área onde você vai colar o conteúdo do script.

### 8. Colar o script SQL

Agora abra o arquivo `01_schema.sql` do projeto.

Faça assim:

- abra o arquivo completo
- copie todo o conteúdo
- volte para o console SQL do D1
- cole o conteúdo inteiro

Cuidado importante:

- não cole só um pedaço do arquivo
- não misture com outro script
- não apague trechos sem saber o que está fazendo

### 9. Executar o script

Depois de colar tudo:

- clique no botão de executar
- aguarde o painel terminar a execução

Se o script estiver correto e o banco estiver vazio, as tabelas devem ser criadas.

### 10. Confirmar a criação das tabelas

Depois da execução:

- veja se o painel mostrou sucesso
- procure a lista de tabelas do banco
- confirme se as tabelas principais aparecem

Se não aparecerem de imediato:

- atualize a tela
- volte para a área de tabelas
- abra novamente os detalhes do banco

## Como encontrar e usar o script SQL correto

O primeiro arquivo que deve ser usado é o schema principal.

Procure no projeto o arquivo:

- `01_schema.sql`

Esse é o arquivo que cria a base do banco.

Na prática, ele contém os comandos que dizem ao D1 quais tabelas devem existir.

### Como usar sem errar

- abra exatamente o arquivo `01_schema.sql`
- copie o conteúdo inteiro, do começo ao fim
- não use `02_indexes.sql` antes do schema principal
- não use `03_compatibility_views.sql` antes do schema principal

### O que evitar

Erros comuns aqui:

- abrir o arquivo errado
- copiar só parte do conteúdo
- colar conteúdo incompleto
- executar índices antes de as tabelas existirem
- executar views antes da base existir

Regra simples:

1. primeiro `01_schema.sql`
2. depois `02_indexes.sql`
3. depois `03_compatibility_views.sql`, se realmente existir e tiver sido aprovado para uso

## Como validar se deu certo

Depois de executar o script principal, faça uma validação simples.

### Verificação 1: confirmar que o banco existe

No painel do Cloudflare:

- volte para a lista de bancos D1
- confirme que o banco criado aparece lá com o nome correto

### Verificação 2: confirmar que não houve erro na execução

No console SQL:

- veja se apareceu mensagem de erro
- se não apareceu erro e a execução terminou normalmente, isso já é um bom sinal

Se aparecer erro, não siga para índices ou views ainda.
Primeiro resolva o erro do schema principal.

### Verificação 3: confirmar que as tabelas existem

Dentro do banco, procure a área de tabelas.

Confirme se existem as tabelas principais criadas pelo script.
Você não precisa decorar todas, mas deve ver que a estrutura foi criada de verdade.

### Verificação 4: teste simples no console

Se quiser fazer uma checagem extra, use uma consulta simples no console SQL para listar as tabelas.

Exemplo:

```sql
SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;
```

Esse comando serve só para listar as tabelas que existem no banco.

Se o schema foi criado corretamente, a lista vai mostrar as tabelas do projeto.

## Erros comuns e como evitar

### Colar script incompleto

Problema:
colar só parte do arquivo e executar.

Como evitar:
sempre copie o arquivo inteiro.

### Usar o banco errado

Problema:
executar o script em outro banco, outro ambiente ou outra conta.

Como evitar:
antes de colar qualquer coisa, confira o nome do banco aberto no painel.

### Rodar índice antes de tabela

Problema:
executar `02_indexes.sql` antes de `01_schema.sql`.

Como evitar:
sempre rode primeiro o schema principal.

### Tentar executar view antes da base existir

Problema:
executar `03_compatibility_views.sql` antes das tabelas principais.

Como evitar:
views só vêm depois da estrutura principal pronta.

### Erro por nome duplicado

Problema:
rodar de novo um script que já criou as mesmas tabelas ou índices.

Como evitar:
se o banco já foi criado e o script já rodou, não execute tudo de novo no mesmo banco sem saber o impacto.

### Erro por sintaxe incompatível

Problema:
usar um script que foi feito para outro banco ou outro dialeto SQL.

Como evitar:
use apenas os arquivos preparados para Cloudflare D1 / SQLite neste projeto.

## Ordem recomendada de execução

Use sempre esta ordem:

1. `01_schema.sql`
2. `02_indexes.sql`
3. `03_compatibility_views.sql`, se existir e se tiver sido considerado seguro para esta etapa
4. validação final

Em linguagem simples:

- primeiro você cria a estrutura principal
- depois melhora desempenho e busca com índices
- depois cria views de compatibilidade, se elas realmente fizerem sentido
- por fim, confere se tudo existe

## Se a pessoa preferir usar terminal

Esse caminho existe, mas não é o mais simples para leigos.

Terminal é a tela de comandos em texto.
Ele costuma ser usado por quem já tem mais familiaridade com linha de comando.

No ecossistema Cloudflare, isso normalmente é feito com o Wrangler CLI.

CLI significa ferramenta de comando.

Resumo simples:

- é possível criar e administrar o D1 pelo terminal
- isso pode ser útil para times técnicos
- para quem é leigo, o painel do Cloudflare costuma ser mais seguro e mais fácil

Se a pessoa nunca usou terminal, o melhor caminho para este processo é o painel web.

## Checklist final

- [ ] Entrei na conta correta do Cloudflare
- [ ] Localizei a área do D1
- [ ] Criei o banco com o nome correto
- [ ] Abri o banco certo
- [ ] Abri o console SQL
- [ ] Executei primeiro o arquivo `01_schema.sql`
- [ ] Confirmei que não houve erro no schema principal
- [ ] Executei depois o arquivo `02_indexes.sql`, se aplicável
- [ ] Executei `03_compatibility_views.sql` apenas se ele existir e for seguro usar
- [ ] Validei a existência das tabelas no banco
- [ ] Confirmei que fiz tudo no ambiente certo

## Observações importantes

Esse processo cria a estrutura do banco.

Isso significa que ele cria as tabelas, índices e possivelmente views.

Isso não significa, por si só, que todos os dados antigos já foram importados.

Importar dados antigos é outra etapa.
Conectar o app a esse banco também pode ser outra etapa.

Em resumo:

- criar o banco é uma etapa
- migrar dados é outra
- integrar com aplicação é outra

Por isso, mesmo que o banco esteja criado corretamente, o sistema ainda pode depender de passos seguintes para ficar operacional por completo.

