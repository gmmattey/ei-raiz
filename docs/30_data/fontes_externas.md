# Fontes externas

## Objetivo
Registrar quais fontes externas fazem sentido para o produto novo e como elas entram.

## Fontes principais

### CVM
Uso recomendado:
- cadastro de fundos
- informe diario de fundos
- documentos e dados publicos de fundos

Regra:
- usar job assincrono
- nunca travar a Home por falha da CVM
- guardar `source`, `referenceDate` e `lastSyncedAt`

### Banco Central
Uso recomendado:
- CDI
- Selic
- lista oficial de participantes do STR
- codigos oficiais das instituicoes

Regra:
- usar como fonte oficial para series e identificacao institucional
- atualizar por rotina separada

### Fonte publica auxiliar
Uso recomendado:
- cotacao e apoio de mercado em contingencia

Regra:
- nunca mandar na posicao do usuario
- nunca derrubar a experiencia principal

## Ordem de confianca
1. dado do usuario
2. snapshot persistido
3. fonte oficial regulatoria
4. fonte auxiliar publica
5. inferencia

## Regra final
Fonte externa complementa.
Nao substitui silenciosamente a base do usuario.
