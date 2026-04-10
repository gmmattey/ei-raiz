# Calibração e backtesting do Score Único (F6.4 / #49)

## Matriz de cenários testados

- Iniciante com carteira concentrada e baixa consistência.
- Moderado com carteira parcialmente concentrada.
- Carteira diversificada e disciplinada.
- Sensibilidade por concentração (`maiorParticipacao` e `top3Participacao`).

## Resultados observados

- Score responde monotonicamente a piora de concentração.
- Cenários estruturalmente melhores convergem para faixas `bom`/`muito_bom`.
- Cenários frágeis convergem para `critico`/`fragil`.
- Fatores negativos e positivos foram mantidos explicáveis por regra.

## Pesos revisados

- `aderenciaPerfil`: 25
- `qualidadeCarteira`: 25
- `consistenciaAportes`: 15
- `adequacaoObjetivo`: 15
- `historicoMomentoVida`: 20

Decisão: manter pesos da V1, sem recalibração numérica nesta etapa, porque os testes de sensibilidade e cenários-base mostraram coerência de comportamento.

## Distorções identificadas e mitigação

- Ausência de cota consolidada de fundos reduz precisão de alguns casos.
- `percentualInternacional` ainda depende de evolução da camada de mercado.
- Mesmo com essas limitações, o modelo permanece determinístico e rastreável.

## Próxima etapa recomendada

- Recalibrar pesos usando dados reais após consolidação de integrações de mercado e histórico de aportes mais granular.
