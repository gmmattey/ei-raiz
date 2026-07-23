# Visão do produto

O projeto novo existe para substituir a base operacional em Apps Script por uma base moderna, mais limpa e preparada para crescer.

O produto continua sendo o mesmo na essência:
- consolidar a vida financeira do usuário em um único lugar
- traduzir a carteira para linguagem simples
- orientar o próximo passo com clareza
- não executar ordens financeiras

## O que o produto precisa entregar

O usuário precisa conseguir:
- entender quanto tem e onde está
- ver o que está pesando bem ou mal na carteira
- saber o principal ponto de atenção do momento
- atualizar os dados com pouco atrito
- receber uma leitura curta, útil e prática

## O que não é prioridade agora

O produto novo não precisa começar com:
- integração direta com corretoras
- Open Finance completo
- parser universal de PDF
- automação complexa
- recomendação sofisticada demais

## Tese central

Primeiro o produto precisa ser muito bom em:
- consolidar
- traduzir
- orientar

Depois ele pode ficar mais inteligente, automático e profundo.

## Forma nova do projeto

A nova base deve nascer pensando em:
- Cloudflare para runtime web
- D1 para persistência
- contratos claros
- front desacoplado do legado
- mesma lógica aproveitável em web e app
- mocks locais para acelerar desenvolvimento

## Regra de ouro

Nada novo deve manter dependência estrutural do Apps Script.
O legado pode servir como origem de contexto, mas não como destino técnico.
