# Esquilo Invest - pacote mestre

Este pacote junta o material mais útil já produzido para reduzir retrabalho, economizar horas e diminuir o desperdício de tokens do Codex.

## Veredito honesto sobre maturidade

Isto **não está completo no sentido absoluto**. Esse conceito vira miragem rápido.
Mas já está **maduro o bastante para exportar e trabalhar sério**.

Hoje o material já cobre muito bem:
- visão do produto
- jornada de telas
- divisão entre o que existe e o que será novo
- prompts por etapa para Codex
- estratégia de ambientes
- mocks locais e de HML
- starter de backend em Cloudflare + D1
- OpenAPI inicial
- schema SQL inicial
- seed SQL inicial

## O que já está maduro

Pode ser tratado como base sólida:
- prompts frontend para Codex
- prompts backend para Cloudflare + D1
- execução com mocks locais/hml/prd
- starter de backend
- contratos OpenAPI iniciais
- schema inicial de D1
- seed inicial
- jornada e boards de apoio

## O que ainda falta para chamar de mais “fechado”

Ainda precisa de mais definição prática:
- payload examples mais completos para todos os estados
- data source factory pronta em código no frontend
- repositórios reais com SQL de leitura por rota
- parser real de importação
- estratégia final de auth
- observabilidade e testes mais duros
- componentes/telas finais no design tool, além do board de fluxo

## Ordem recomendada de consumo

1. `OLD/03_EXECUTION_PACK_MOCKS/docs/00_README.md`
2. `OLD/01_PROMPTS_FRONTEND_CODEX/00_README.md`
3. `OLD/02_PROMPTS_BACKEND_CLOUDFLARE_D1/00_README.md`
4. `04_STARTER_BACKEND/`
5. `OLD/06_VISUAL_BOARDS_LINKS/`

## O que eu faria agora

Se a ideia é maximizar produtividade do Codex:
- usar os mocks locais primeiro
- fechar o frontend em cima deles
- só depois plugar o backend real
- deixar importação real, análise real e dados externos para depois da base UI pronta

## Regra de ouro

Qualquer coisa complexa deve entrar **depois** que:
- a jornada principal estiver fechada
- a UI consumir contratos estáveis
- a troca local -> hml -> prd estiver simples
