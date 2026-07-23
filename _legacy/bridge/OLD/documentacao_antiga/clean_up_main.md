# Limpeza final da main

## Objetivo
Deixar a raiz do repositório mais limpa, reduzindo a sensação de arquivos e pastas soltas.

## Estrutura desejada no topo
- `README.md`
- `docs/`
- `apps/`
- `services/`
- `packages/`
- `database/`
- `tooling/`
- `assets/`

## O que deve sair do topo
- `scripts/`
- `tests/`

## Para onde isso vai
- `scripts/README.md` -> `tooling/scripts/README.md`
- `tests/README.md` -> `tooling/tests/README.md`

## Passo a passo sugerido
```bash
mkdir -p tooling/scripts tooling/tests

git mv scripts/README.md tooling/scripts/README.md
git mv tests/README.md tooling/tests/README.md

rmdir scripts 2>/dev/null || true
rmdir tests 2>/dev/null || true
```

## Ajuste no README da raiz
Trocar:
- `scripts/` automações locais
- `tests/` testes e cenários

Por:
- `tooling/` automações, utilitários e apoio de validação

## Observação
A estrutura já está pronta nesta branch. O que falta é a remoção/movimentação final dos diretórios antigos, que o conector atual não executa com segurança.
