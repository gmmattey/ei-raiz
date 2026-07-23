# Pocket Ops - Matriz de Preservacao

## Manter

- Contrato central de `getDashboardData()`.
- Score da carteira, radar, recomendacao principal e missao baseada em `actionPlan`.
- Leitura da Esquilo IA usando o mesmo contexto consolidado do dashboard.
- Separacao atual entre frontend e backend no AppScript.

## Ajustar

- Hierarquia visual da home para leitura vertical e toque.
- Navegacao para tabs mobile (`Visao`, `Carteira`, `Insights`).
- Cards de categoria para um detalhe por tela, em vez de expandir tudo na home.
- Consumo do backend por HTTP em vez de `google.script.run`.

## Recriar

- Shell nativo do app em Flutter.
- Tema tatico mobile, componentes e widgets de layout.
- Roteamento entre home e detalhe de categoria.
- Endpoint JSON no AppScript para o app mobile.

## Observacoes

- O backend continua sendo o AppScript.
- Nenhuma regra de negocio foi alterada nesta etapa.
- O MVP mobile evita CRUD e fluxos operacionais mais profundos neste primeiro corte.
