# Conectores externos

## CVM
Entradas esperadas:
- cadastro de fundos
- informe diario

Saidas internas esperadas:
- fundos normalizados
- data de referencia
- valor de cota quando aplicavel
- status da sincronizacao

## Banco Central
Entradas esperadas:
- CDI e Selic
- lista de participantes do STR

Saidas internas esperadas:
- series de referencia
- bancos e instituicoes com codigo oficial
- status da sincronizacao

## IA providers
Entradas esperadas:
- payload estruturado do backend
- schema de saida esperado

Saidas internas esperadas:
- JSON padronizado
- recommendation tag
- warnings

## Regra
Conector externo deve ser adaptador.
Nao deve vazar formato bruto para a UI.
