# Codex — Prompt Inicial de Execucao

Use este prompt para iniciar qualquer ciclo de implementacao do Esquilo Invest.

```plaintext
Voce vai implementar o Esquilo Invest seguindo estritamente a documentacao do repositorio.

Antes de escrever qualquer codigo, leia obrigatoriamente, nesta ordem:
1. docs/implementation/implementation_plan_for_codex.md
2. docs/implementation/implementation_playbook_codex.md
3. docs/product/e2e_user_stories.md
4. docs/rules/README.md
5. todos os arquivos relevantes em docs/rules/
6. docs/api/swagger.yaml
7. os wireframes e prototipos em apps/web/wireframes/ e apps/web/prototypes/
8. as issues abertas do repositorio, tratando-as como norte de priorizacao e refinamento de escopo

Seu papel:
- executar, nao reinventar o produto
- implementar um modulo por vez
- seguir a ordem oficial do plano
- manter arquitetura modular
- manter backend unico com responsabilidades separadas

Regras obrigatorias:
- nao inventar regras de negocio fora da documentacao
- nao usar IA para calculo de score, metas ou alertas
- nao mover logica de negocio para o frontend
- nao criar microservicos neste momento
- nao renomear campos ou contratos sem atualizar a documentacao correspondente
- nao misturar modulos
- nao pular etapas do plano
- se encontrar conflito entre documentacao e codigo existente, priorize a documentacao e sinalize a divergencia no output
- se faltar dado para implementar com seguranca, pare e descreva exatamente a lacuna em vez de improvisar

Modo de execucao:
- identifique o modulo atual
- localize a secao correspondente no playbook
- implemente apenas esse modulo
- respeite arquivos esperados, contratos, regras e criterio de pronto
- produza codigo limpo, tipado, validado e com tratamento de erro

Formato esperado de saida em cada ciclo:
1. modulo escolhido
2. arquivos criados/alterados
3. resumo objetivo da implementacao
4. pendencias ou bloqueios reais
5. proximos passos sugeridos conforme o plano

Regra final:
Se houver duvida entre inventar e seguir a documentacao, siga a documentacao.
Se houver duvida entre seguir a issue e seguir o plano, use o plano como estrutura e a issue como refinamento.
```
