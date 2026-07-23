# Prompt 05 — Read model do Dashboard e da Carteira

Quero que você defina o **read model** do Esquilo Invest para alimentar a nova Home e a nova Carteira, no backend Cloudflare + D1.

## Missão

Separar claramente:
- dado persistido
- dado derivado
- dado pronto para consumo da interface

## Regras obrigatórias

- Não copie o payload do Apps Script de forma cega.
- Use o legado apenas para entender o que o produto já tenta mostrar.
- A nova resposta precisa ser mais limpa, estável e orientada ao produto final.
- Separe leitura de Home, Carteira, Detalhe do Ativo, Perfil e Radar se isso fizer sentido.
- Dê prioridade a contratos estáveis e legíveis.

## O que eu quero como saída

Entregue:
1. payload ideal da Home
2. payload ideal da Carteira
3. payload ideal do detalhe do ativo
4. payload ideal do Perfil
5. payload ideal do Radar / Inteligência
6. campos persistidos x campos calculados
7. consultas e agregações necessárias
8. estratégia para updatedAt, sourceWarning e origem dos dados
9. estratégia para ordenação por relevância
10. estratégia para comparar categoria, plataforma e distribuição

## Critério de qualidade

Quero um desenho que deixe a UI mais simples, e não mais dependente do caos do backend.
