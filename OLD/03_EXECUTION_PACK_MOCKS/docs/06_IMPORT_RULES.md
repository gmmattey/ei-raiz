# Regras de importação

## Objetivo

Evitar que o Codex invente regra sozinho.

## Regras mínimas

1. Toda importação gera registro de import.
2. Toda linha importada pode ser:
   - válida
   - inválida
   - duplicada
   - conflitada
3. O usuário sempre vê preview antes de commit.
4. Commit de importação pode gerar snapshot.
5. Importação não deve sobrescrever silenciosamente dado sem rastreabilidade.

## Casos que precisam estar cobertos

- mesmo ativo em plataformas diferentes
- nomes diferentes para o mesmo ativo
- arquivo parcial
- linhas sem quantidade
- linhas sem preço médio
- ativo ainda não mapeado
- linha repetida no mesmo arquivo
- reimportação de arquivo muito parecido

## Regra de produto

Quando houver dúvida na reconciliação:
- sinalizar conflito
- não assumir solução mágica
