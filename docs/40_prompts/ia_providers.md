# Providers de IA

## Objetivo
Usar uma camada unica de IA com mais de um provider por baixo.

## Providers previstos
- OpenAI
- Gemini

## Regra de arquitetura
A aplicacao nao deve conhecer provider direto.
Ela chama uma camada unica de analise.

## OpenAI
Uso esperado:
- leitura estruturada
- JSON padronizado
- fallback quando necessario

## Gemini
Uso esperado:
- leitura estruturada
- JSON padronizado
- alternativa de provider

## Regras
- mesma entrada de negocio para os dois
- mesma saida padronizada para a UI
- recommendation tag obrigatoria
- warnings obrigatorios quando houver baixa confianca
- no maximo 3 linhas por bloco textual

## Regra de seguranca
Se faltar dado, o provider pede revisao.
Nao inventa certeza.
