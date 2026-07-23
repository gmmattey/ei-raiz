# Estratégia de ambientes

## Ambientes previstos

- local
- hml
- prd

## Regra principal

A aplicação deve decidir a fonte de dados por ambiente, sem espalhar decisões pela interface.

## Estratégia recomendada

Criar uma fábrica única de data sources.

Exemplo conceitual:
- `createDataSources('local')`
- `createDataSources('hml')`
- `createDataSources('prd')`

## Comportamento por ambiente

### local
- usa JSON mockado local
- serve para desenvolver interface, navegação e contrato
- pode simular atraso, falha e ausência de dados

### hml
- pode usar mock homologado estático ou backend real parcial
- bom para validar contrato e comportamento sem risco de produção

### prd
- usa backend HTTP real
- sem mock ativo como fonte principal

## Regra de simplicidade

Subir para produção deve significar, idealmente:
- trocar uma variável de ambiente
- ou trocar um arquivo de bootstrap
- ou trocar a implementação da fábrica

Não deve significar:
- sair mexendo em dezenas de telas
- trocar import manual em toda parte
- reescrever hooks
