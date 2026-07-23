# Pocket Ops - Stories do MVP Mobile

## Feature: Arquitetura inicial Flutter + AppScript

**User Story**  
Como responsavel tecnico do produto, quero uma arquitetura simples para Flutter e AppScript para iniciar o app mobile sem duplicar regra de negocio.

**Descricao**  
Separar shell Flutter, modelos, camada HTTP e telas mobile, mantendo o AppScript como backend principal.

**Criterios de aceite**
- existe uma pasta `mobile_app/` isolada
- o app Flutter consome o AppScript por HTTP
- o backend continua sendo o mesmo runtime em Apps Script
- nao ha nova regra de negocio paralela no mobile

## Feature: Blueprint da solucao

**User Story**  
Como time de produto e engenharia, quero um blueprint visual da arquitetura para orientar a evolucao do app mobile.

**Descricao**  
Registrar em PDF a relacao entre Flutter, telas, navegacao, servicos, modelos e AppScript.

**Criterios de aceite**
- existe um blueprint salvo em PDF
- o PDF fica dentro de `mobile_app/docs/`
- o blueprint mostra Flutter, AppScript, modelos, services e backend

## Feature: Estrutura base do app

**User Story**  
Como desenvolvedor Flutter, quero uma base organizada por responsabilidades para evoluir o app com baixo atrito.

**Descricao**  
Criar shell, tema, roteamento, widgets compartilhados, service layer e modelos iniciais.

**Criterios de aceite**
- o app abre por `main.dart`
- existe roteamento entre home e detalhe por categoria
- o projeto passa em `flutter analyze`
- o projeto passa em `flutter test`

## Feature: Home mobile

**User Story**  
Como investidor iniciante, quero uma home mobile clara para entender rapidamente minha carteira no celular.

**Descricao**  
Exibir patrimonio total, score, alocacao, radar e missao em layout vertical e legivel.

**Criterios de aceite**
- a home mostra patrimonio total
- a home mostra score da carteira
- a home mostra alocacao por macroclasse
- a home mostra radar e missao em blocos independentes

## Feature: Integracao com backend

**User Story**  
Como app mobile, quero consumir o mesmo backend atual para evitar drift entre web e mobile.

**Descricao**  
Criar um endpoint JSON minimo no AppScript e uma camada HTTP no Flutter.

**Criterios de aceite**
- `doGet()` segue servindo HTML por padrao
- `format=json&resource=dashboard` retorna JSON valido
- `format=json&resource=ai-analysis` retorna a leitura da Esquilo IA
- o app Flutter consegue montar modelos a partir do payload

## Feature: Navegacao mobile

**User Story**  
Como usuario mobile, quero navegar entre visao geral, carteira e insights sem poluir a home.

**Descricao**  
Usar tabs simples no shell mobile e uma tela de detalhe por categoria.

**Criterios de aceite**
- existem tabs para `Visao`, `Carteira` e `Insights`
- a categoria abre em tela dedicada
- a home nao fica entulhada com todos os detalhes

## Feature: Preparacao para testes locais

**User Story**  
Como usuario do projeto, quero instrucoes honestas para testar localmente em Android e entender a limitacao do iPhone.

**Descricao**  
Documentar `dart-define`, validar o Flutter local e listar dependencias externas que ainda faltam.

**Criterios de aceite**
- existe instrucao de `flutter run` com `APP_SCRIPT_BASE_URL`
- o README do app cita `APP_SCRIPT_API_TOKEN`
- as limitacoes do iPhone sem App Store sao explicadas

## Feature: Ajustes minimos necessarios no AppScript

**User Story**  
Como mantenedor do backend, quero saber exatamente o que mudou no AppScript para suportar o app mobile.

**Descricao**  
Listar os arquivos alterados e o contrato minimo da API mobile.

**Criterios de aceite**
- os arquivos AppScript impactados estao documentados
- o token mobile opcional esta descrito
- o contrato mobile fica salvo em `mobile_app/docs/appscript_mobile_contract.md`
