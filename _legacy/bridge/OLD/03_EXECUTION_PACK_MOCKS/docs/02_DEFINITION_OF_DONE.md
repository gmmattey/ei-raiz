# Definition of Done

## Tela pronta

Uma tela só está pronta quando:
- abre pela rota correta
- renderiza com dados mockados realistas
- trata loading
- trata erro
- trata vazio
- possui ação principal clara
- não tem placeholder fake, lorem ipsum ou bloco morto
- não depende de backend real para ser demonstrável

## Fluxo pronto

Um fluxo só está pronto quando:
- o usuário entra
- entende o que fazer
- conclui a tarefa principal
- consegue voltar ou continuar sem ficar perdido

## Contrato pronto

Um contrato só está pronto quando:
- existe schema
- existe exemplo real de payload
- app e web conseguem consumir o mesmo formato
- a troca de mock para HTTP não muda o modelo usado pela UI

## Integração pronta

Uma integração só está pronta quando:
- a fonte mock pode ser trocada por fonte real
- a UI não precisa ser reescrita
- a diferença fica isolada na camada de data source
