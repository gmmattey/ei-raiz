# Exportação CSV do Savro

Especificação da exportação legível do aplicativo Savro (KMP, `aplicativo/`).
Issue de origem: **#121** (MVP1). Implementação única em
`aplicativo/shared/core/backup/src/commonMain/kotlin/io/savro/backup/ExportadorCsv.kt`,
compartilhada por Android e iOS.

---

## 1. Para que serve — e o que ela não é

O CSV existe para o usuário **sair do Savro**: abrir os dados em planilha, importar em outra
ferramenta, imprimir, arquivar. É a garantia de que ninguém fica preso ao app.

**O CSV não é backup.** Ele é texto claro, sem senha e sem criptografia: qualquer pessoa com acesso
ao arquivo lê tudo. A UI diz isso explicitamente antes de exportar, com um aviso destacado, e a
exportação exige uma confirmação a mais por causa disso. Para guardar com proteção, o caminho é o
`*.savrobackup` (ver `formato-savrobackup.md`).

O CSV **não é restaurável** pelo app no MVP1 — a importação é de mão única, para fora.

Como no backup: **o servidor Savro nunca recebe o arquivo**. A exportação é local, gravada em área
temporária privada e entregue ao seletor nativo do sistema (Storage Access Framework no Android,
`UIDocumentPickerViewController` no iOS). O temporário é removido em sucesso, cancelamento ou erro.

---

## 2. Formato

- **Codificação:** UTF-8 **com BOM** (`EF BB BF`). O BOM é opcional em UTF-8 e ignorado por
  leitores que seguem a RFC 4180; sem ele, o Excel em português abre `Instituição` como
  `InstituiÃ§Ã£o`, que é o caso de uso mais comum do público do Savro.
- **Separador de campo:** vírgula (`,`).
- **Terminador de linha:** `CRLF` (`\r\n`), inclusive na última linha.
- **Aspas:** um campo é envolvido em aspas duplas quando contém `,`, `"`, `CR` ou `LF`. Aspas
  internas são duplicadas (`"` → `""`). Campos sem esses caracteres saem sem aspas. Conforme
  RFC 4180.
- **Primeira linha:** cabeçalho com os nomes canônicos abaixo, nesta ordem exata.
- **Ordem das linhas:** estável, por `id` crescente — duas exportações do mesmo conteúdo produzem
  o mesmo arquivo.
- **Campos opcionais ausentes:** coluna vazia (nunca `null`, `NULL` ou `-`).

---

## 3. Colunas canônicas

| # | Coluna | Conteúdo |
|---|---|---|
| 1 | `id` | Identificador interno do item. Estável entre exportações e igual ao do backup. |
| 2 | `tipo` | `CONTA`, `RENDA_VARIAVEL`, `RENDA_FIXA`, `CRIPTO`, `BEM`, `DIVIDA` ou `OUTRO`. |
| 3 | `nome` | Nome dado pelo usuário. |
| 4 | `valor` | Valor legível com ponto decimal e sem separador de milhar (`1234.56`, `-1234.56`). |
| 5 | `valor_centavos` | Coluna canônica: inteiro em centavos, sem ponto flutuante (`123456`). |
| 6 | `moeda` | Código da moeda (`BRL`, `USD`, …). |
| 7 | `instituicao` | Instituição informada, ou vazio. |
| 8 | `observacao` | Observação do usuário, ou vazio. Pode conter quebra de linha (fica entre aspas). |
| 9 | `quantidade` | Quantidade com 3 casas decimais (`12.500`), ou vazio. |
| 10 | `preco_medio` | Preço médio com 2 casas decimais, ou vazio. |
| 11 | `origem` | Origem do valor. No MVP1, sempre `MANUAL`. |
| 12 | `arquivado` | `sim` ou `nao`. |
| 13 | `criado_em` | Data/hora de criação em ISO 8601 UTC (`2023-11-14T22:13:20Z`). |
| 14 | `atualizado_em` | Data/hora da última atualização, mesmo formato. |

### Decisões de formatação

- **`valor` e `valor_centavos` juntos, de propósito.** `valor` é para ler; `valor_centavos` é para
  contar. Valores monetários no Savro são inteiros em centavos e nunca `Double` — expor só o texto
  formatado empurraria quem reimporta para o ponto flutuante.
- **Ponto decimal, não vírgula.** Com separador de campo `,`, valores com vírgula decimal exigiriam
  aspas em toda linha e confundiriam parsers simples. `valor_centavos` cobre o caso de quem precisa
  do número exato; planilhas em pt-BR podem precisar de "substituir `.` por `,`" na coluna 4.
- **Datas em UTC com sufixo `Z`.** O arquivo é interpretável sem saber o fuso do aparelho que o
  gerou. O app armazena apenas epoch em milissegundos; não há fuso original a preservar.
- **`arquivado` como `sim`/`nao`.** Legível em planilha, sem depender de o leitor entender
  `TRUE`/`1`.

---

## 4. Escopo do que é exportado

Apenas **itens patrimoniais**, incluindo os arquivados (marcados na coluna `arquivado`).

Ajustes de valor e eventos da linha do tempo **não** saem no CSV do MVP1: são históricos de
relacionamento entre registros, que não cabem em uma tabela plana sem inventar um segundo arquivo
ou colunas repetidas. Quem precisa desse histórico usa o backup criptografado, que preserva tudo.

Nenhuma preferência, configuração de proteção ou material criptográfico aparece no CSV.

---

## 5. Exemplo

```csv
id,tipo,nome,valor,valor_centavos,moeda,instituicao,observacao,quantidade,preco_medio,origem,arquivado,criado_em,atualizado_em
item-01,CONTA,"Conta corrente, principal",12345.67,1234567,BRL,"Banco ""Bom"", S.A.","linha 1
linha 2",,,MANUAL,nao,2023-11-14T22:13:20Z,2023-11-14T22:21:40Z
item-02,DIVIDA,Financiamento,-50000.00,-5000000,EUR,Créditos Ltda,,,,MANUAL,nao,2023-11-17T05:53:20Z,2023-11-18T09:40:00Z
```

(Na terceira linha do bloco acima, a quebra de linha faz parte do campo `observacao` e está dentro
de aspas — comportamento correto conforme RFC 4180.)
