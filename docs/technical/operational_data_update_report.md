# Operational Data Update Report

Fonte: Esquilo_Invest_v3 (3).xlsx
Destino: Esquilo_Invest_Operacional.xlsx

## Volumes
- Acoes: origem valida=4, destino antes=5, destino depois=4
- Fundos: origem valida=6, destino antes=6, destino depois=6
- Previdencia: origem valida=5, destino antes=4, destino depois=5
- PreOrdens: origem valida=3, destino antes=3, destino depois=3
- Aportes: origem valida=12, destino antes=12, destino depois=12

## Descartes aplicados
- Linhas vazias, totalizadoras, decorativas e placeholders foram ignoradas.
- Acoes com status diferente de Comprado foram ignoradas na base operacional.
- Config permaneceu intacta por nao haver fonte homologa na v3.

## Validacao final
- Acoes: linhas nao vazias apos atualizacao = 5
- Fundos: linhas nao vazias apos atualizacao = 7
- Previdencia: linhas nao vazias apos atualizacao = 6
- PreOrdens: linhas nao vazias apos atualizacao = 4
- Aportes: linhas nao vazias apos atualizacao = 13
- Config: linhas nao vazias apos atualizacao = 1