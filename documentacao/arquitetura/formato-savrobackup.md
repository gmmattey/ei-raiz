# Formato `*.savrobackup` — backup criptografado do Savro

Especificação normativa do arquivo de backup do aplicativo Savro (KMP, `aplicativo/`).
Issue de origem: **#121** (MVP1). Arquitetura de referência: **ADR-002** (Android e iOS como
runtimes de primeira classe sobre KMP).

Este documento é a fonte da verdade do formato. A única implementação dele vive em
`aplicativo/shared/core/backup/src/commonMain/kotlin/io/savro/backup/` e é compartilhada pelas duas
plataformas — Android e iOS não têm implementações separadas do formato, só das primitivas
criptográficas do sistema operacional.

---

## 1. Modelo de ameaça

### O que o formato protege

| Cenário | Proteção |
|---|---|
| Aparelho perdido ou roubado com o arquivo de backup dentro | O conteúdo só abre com a senha escolhida pelo usuário; a chave não deriva de nada guardado no aparelho. |
| Backup salvo em nuvem de terceiros (Google Drive, iCloud Drive, e-mail) pelo próprio usuário | O provedor recebe apenas texto cifrado autenticado; sem a senha não há leitura nem edição silenciosa. |
| Adulteração do arquivo (troca de bytes, downgrade de parâmetros do KDF, truncamento) | AES-256-GCM autentica corpo **e** cabeçalho; qualquer alteração invalida a tag e o arquivo é recusado antes de qualquer escrita no banco. |
| Comprometimento do servidor Savro | Irrelevante para o backup: **o servidor nunca vê o arquivo**. Não há upload, sincronização, telemetria de conteúdo nem chamada de rede em nenhum ponto do fluxo. |
| Chave do Keystore/Keychain revogada (biometria alterada, aparelho restaurado) | O backup é independente do material criptográfico local, então continua restaurável. É justamente o caminho de recuperação previsto quando o cofre local fica inacessível. |

### O que o formato **não** protege

- **Senha fraca ou reutilizada.** PBKDF2 encarece a tentativa, não a impede. A UI exige no mínimo
  8 caracteres e avisa que a senha não é recuperável, mas não mede força além disso.
- **Aparelho comprometido em execução.** Malware com acesso ao processo do app vê os dados em
  claro independentemente do formato do arquivo.
- **Perda da senha.** Não existe recuperação, dica, pergunta secreta nem cópia de segurança da
  senha. Sem a senha o backup é irrecuperável, por construção.
- **Metadados de arquivo.** Tamanho do arquivo, data de modificação e nome sugerido
  (`savro-aaaa-mm-dd.savrobackup`) são visíveis para quem tiver o arquivo. O tamanho dá uma ideia
  grosseira do volume de dados; nenhuma contagem, valor, moeda ou instituição vaza por eles.
- **Sigilo do fato de existir um backup.** O cabeçalho é público e identificável (`SAVROBK1`).

---

## 2. Layout do arquivo

Tudo em **big-endian**. O cabeçalho tem exatamente 48 bytes e fica em texto claro.

```
offset  tamanho  campo             conteúdo
------  -------  ----------------  ---------------------------------------------------
0       8        magia             "SAVROBK1" (ASCII, 53 41 56 52 4F 42 4B 31)
8       2        versaoFormato     uint16 — versão desta especificação (hoje 1)
10      2        versaoEsquema     uint16 — versão do schema do cofre (hoje 4)
12      1        idKdf             uint8  — 1 = PBKDF2-HMAC-SHA1
13      4        iteracoesKdf      uint32 — iterações usadas neste arquivo
17      1        idCifra           uint8  — 1 = AES-256-GCM (tag de 128 bits)
18      2        reservado         uint16 — sempre 0
20      16       salt              salt aleatório do KDF
36      12       nonce             nonce/IV aleatório do GCM, único por arquivo
48      N        corpo             ciphertext || tag(16 bytes)
```

- **AAD:** os 48 bytes do cabeçalho entram integralmente como dados autenticados adicionais. Um
  atacante não consegue baixar `iteracoesKdf`, trocar o `salt` ou forjar uma versão de schema sem
  invalidar a tag.
- **Sem campo de tamanho do corpo:** o corpo é "todo o resto do arquivo". Truncamento é detectado
  pela falha de autenticação, não por um campo que poderia divergir do conteúdo real.
- **Sem dado do usuário no cabeçalho:** a data do backup, a contagem de itens e a lista de moedas
  ficam dentro da parte cifrada. Há um teste automatizado (`cabecalhoNaoRevelaDataNemQuantidadeDeItens`)
  garantindo que a data não aparece no cabeçalho.

---

## 3. Criptografia

### 3.1 Derivação de chave

```
chave = PBKDF2-HMAC-SHA1(senhaCanonica, salt, iteracoesKdf, 32 bytes)
```

- **Iterações padrão na geração: 1.300.000** — recomendação da OWASP (*Password Storage Cheat
  Sheet*) para PBKDF2 com PRF HMAC-SHA1. O número fica gravado no arquivo: subir esse padrão no
  futuro não invalida nenhum backup já gerado.
- **Teto na leitura: 10.000.000 iterações.** Um arquivo adulterado pedindo bilhões de iterações
  travaria o aparelho antes de a tag ser verificada (a derivação acontece antes da autenticação,
  por construção do PBKDF2). É proteção contra negação de serviço, não piso de segurança.
- **`salt` de 16 bytes**, novo a cada arquivo, do gerador seguro do sistema (`SecureRandom` no
  Android, `SecRandomCopyBytes` no iOS).

#### Por que HMAC-SHA1 e não HMAC-SHA256

`SecretKeyFactory` do Android só oferece `PBKDF2WithHmacSHA256` **a partir da API 26**, e o Savro
suporta `minSdk = 23`. Um formato cuja chave dependesse da versão do Android quebraria o critério
de aceite de interoperabilidade — o mesmo arquivo tem que abrir em qualquer aparelho suportado, e
não em "alguns Androids".

HMAC-SHA1 permanece adequado como PRF: os ataques conhecidos ao SHA-1 são de colisão e não se
aplicam à construção HMAC. O custo relativo é compensado pelas 1.300.000 iterações.

**Caminho de evolução, já previsto:** `idKdf` é um campo versionado. Quando o `minSdk` subir para
26 (ou quando houver Argon2id auditado e disponível nas duas plataformas), basta definir
`idKdf = 2` (PBKDF2-HMAC-SHA256) ou `idKdf = 3` (Argon2id) para os arquivos novos; os antigos
continuam abrindo, porque o id do KDF viaja dentro do arquivo. Nenhuma migração de dados é
necessária.

#### 3.1.1 Codificação canônica da senha

Antes de entrar no PBKDF2, a senha passa por uma transformação determinística e reversível:

```
senhaCanonica = hexMinusculo(UTF-8(senhaDoUsuario))
```

Exemplo: `sen#ha-Aç4o-"forte"` → `73656e2368612d41c3a7346f2d22666f72746522`.

Isso não é enfeite. Os provedores de PBKDF2 **discordam** sobre como transformar `char[]` em bytes:
o Bouncy Castle empacotado no Android usa truncamento de 8 bits (`PKCS5PasswordToBytes`), enquanto
Conscrypt e CommonCrypto usam UTF-8. Para uma senha com acento, o mesmo backup derivaria chaves
diferentes conforme a versão do Android ou a plataforma — e o arquivo pareceria "corrompido" ao
usuário. Passando só caracteres ASCII, todos os provedores concordam byte a byte.

O custo é nulo em segurança (mapeamento bijetivo, entropia preservada) e o teste
`codificacaoDaSenhaEhIdenticaNasDuasPlataformas` fixa esse contrato nas duas plataformas.

### 3.2 Cifra

```
corpo = AES-256-GCM(chave, nonce, aad = cabecalho[0..48), texto = corpoCanonicoUtf8)
```

- Tag de **128 bits**, anexada ao final do ciphertext (convenção do JCA e do CommonCrypto).
- **Nonce de 12 bytes, único por arquivo**, sempre novo do gerador seguro do sistema. Nunca há
  reuso de par (chave, nonce): o salt também muda a cada arquivo, então nem a chave se repete.
- Implementações: `javax.crypto.Cipher("AES/GCM/NoPadding")` no Android (Conscrypt/BoringSSL) e
  `CCCryptorCreateWithMode(kCCModeGCM, kCCAlgorithmAES)` no iOS (CommonCrypto). **Nenhuma
  primitiva criptográfica é implementada pelo Savro.**

### 3.3 Falhas e vazamento de informação

Senha errada, byte adulterado, arquivo truncado, corpo inconsistente e JSON malformado resultam
**todos** no mesmo erro genérico `ErroBackup.ArquivoInvalido`. A UI mostra sempre a mesma frase.
Distinguir "senha errada" de "arquivo corrompido" transformaria o arquivo em oráculo de senha para
quem o roubasse.

As duas exceções conscientes são `VersaoFormatoIncompativel` e `EsquemaIncompativel`: essas
informações estão no cabeçalho em texto claro, não dependem da senha e não dizem nada sobre o
conteúdo. Sem elas, o usuário ficaria sem saber que precisa atualizar o app.

Nunca são registrados em log: senha, senha canônica, chave derivada, conteúdo decifrado ou
mensagem crua da engine de banco. A comparação de tag no iOS é feita em tempo constante.

Buffers sensíveis (chave derivada, corpo serializado, corpo decifrado) são zerados
(`ByteArray.fill(0)`) assim que deixam de ser necessários, e o `PBEKeySpec` do Android recebe
`clearPassword()`. Isso é melhor esforço: nem a JVM nem o Kotlin/Native garantem que não houve
cópia intermediária na memória.

---

## 4. Corpo: JSON canônico

O texto cifrado é um documento JSON em UTF-8, **sem espaços em branco**, com:

- chaves de objeto em **ordem alfabética**;
- listas ordenadas por `id` (ordem total, estável mesmo com datas iguais);
- inteiros apenas — não existe ponto flutuante no modelo do Savro (valores monetários são `Long`
  em centavos; quantidades são `Long` em milésimos);
- escaping conforme RFC 8259: obrigatoriamente `"`, `\` e controles abaixo de `0x20`; acentos e
  emoji saem literais em UTF-8, não como `\uXXXX`.

Consequência prática: **o mesmo conteúdo produz exatamente os mesmos bytes** em Android e iOS.
É isso que permite o vetor de teste compartilhado da seção 6.

### Estrutura

```json
{
  "ajustes": [
    {
      "dataEpocaMs": 1700000500000,
      "id": "ajuste-01",
      "itemId": "item-01",
      "origem": "MANUAL",
      "valorCentavosAnterior": 1000000,
      "valorCentavosNovo": 1234567
    }
  ],
  "criadoEmEpocaMs": 1780123456789,
  "eventos": [
    {
      "dataEpocaMs": 1700000500000,
      "id": "evento-01",
      "itemId": "item-01",
      "itemNome": "Conta corrente",
      "tipo": "VALOR_AJUSTADO"
    }
  ],
  "itens": [
    {
      "arquivado": false,
      "atualizadoEmEpocaMs": 1700000500000,
      "criadoEmEpocaMs": 1700000000000,
      "id": "item-01",
      "instituicao": "Banco",
      "moeda": "BRL",
      "nome": "Conta corrente",
      "observacao": null,
      "origem": "MANUAL",
      "precoMedioCentavos": null,
      "quantidadeMilesimos": null,
      "tipo": "CONTA",
      "valorCentavos": 1234567
    }
  ],
  "preferencias": { "timeoutInatividadeMs": 90000 },
  "versaoEsquema": 4
}
```

### O que **não** entra no backup

| Item | Motivo |
|---|---|
| Chave mestra do banco (Keystore/Keychain) | É material local e intransferível. O backup precisa abrir em outro aparelho; incluir a chave transformaria o arquivo em cópia do cofre. |
| Política de proteção (biometria / código do dispositivo) | Depende de material criptográfico que só existe no aparelho de origem. Restaurar "biometria ativada" em um aparelho onde essa chave não existe anunciaria uma proteção inexistente. O usuário reativa a proteção no aparelho novo. |
| `onboardingConcluido`, `chaveInvalidadaPersistida` | Estado desta instalação, não preferência do usuário. |
| Qualquer credencial, token ou identificador de servidor | Não existem: o app é local-first e o servidor não participa do fluxo. |

### Compatibilidade de versão de schema

- `versaoEsquema` **maior** que a suportada pelo app → `EsquemaIncompativel`, recusado antes de
  decifrar. Restaurar jogaria fora campos que este app não conhece.
- `versaoEsquema` **menor ou igual** → aceito. O leitor aplica os mesmos padrões das migrations
  para campos que ainda não existiam (`moeda = "BRL"`, `origem = MANUAL`, `arquivado = false`,
  listas vazias). Campo presente com tipo errado é recusado, nunca "consertado".
- `versaoEsquema` do cabeçalho e do corpo precisam coincidir; divergência é `ArquivoInvalido`.
- Ajuste ou evento apontando para um `itemId` ausente é `ArquivoInvalido` — recusado **antes** de
  tocar no banco, para não derrubar a transação de restauração no meio por violação de FK.

---

## 5. Restauração

Ordem obrigatória, implementada em `ServicoBackup`:

1. **Selecionar** o arquivo pelos mecanismos nativos (SAF no Android,
   `UIDocumentPickerViewController` no iOS). Nada é validado ainda.
2. **Validar** cabeçalho → versão de formato → versão de schema → integridade (tag AEAD) → senha →
   consistência do conteúdo. Nenhuma escrita no banco acontece nesta etapa. **Arquivo inválido
   nunca altera o cofre atual, em nenhuma circunstância.**
3. **Prévia obrigatória**, mostrando: data do backup, quantidade de itens, de ajustes e de
   eventos, moedas encontradas, versão do formato e do schema, e o impacto explícito ("isso
   substituirá todos os dados atuais", com a contagem atual do aparelho).
4. **Confirmação explícita** do usuário — no MVP1, além do botão, é preciso marcar "entendi que os
   dados atuais serão substituídos".
5. **Aplicar** em **uma única transação de banco**: apaga eventos, ajustes e itens, e regrava o
   conteúdo do backup preservando ids e datas originais. Qualquer falha, interrupção ou
   incompatibilidade no meio reverte tudo — o cofre volta exatamente ao estado anterior.
6. As **preferências** só são gravadas depois do commit do banco. Se a transação falhar, nem o
   cofre nem as preferências mudam.

**Estratégia do MVP1: substituição total.** Não há mesclagem. Isso está escrito na prévia, antes da
confirmação.

---

## 6. Interoperabilidade Android ↔ iOS

Critério de aceite da #121, verificado por teste automatizado em `commonTest`, executado nas duas
plataformas (`:shared:core:backup:testDebugUnitTest` na JVM e
`:shared:core:backup:iosSimulatorArm64Test` no simulador iOS, ambos na CI):

`VetoresDeReferencia.ARQUIVO_HEX` é um arquivo `*.savrobackup` real, gerado uma única vez pela
implementação Android e congelado como constante. Ele contém acento, aspas, vírgula, quebra de
linha, tabulação, barra invertida, emoji, valor negativo (dívida), item arquivado, campos opcionais
nulos e preenchidos, três moedas, um ajuste e um evento. A senha do vetor tem acento e aspas de
propósito.

- `oArquivoDeReferenciaAbreNestaPlataforma` — rodando no iOS, prova **Android → iOS**: um arquivo
  produzido na outra plataforma abre e devolve exatamente o conteúdo esperado.
- `regerarOArquivoDeReferenciaProduzOsMesmosBytes` — rodando no iOS, prova **iOS → Android**: com
  os mesmos parâmetros, o iOS gera byte a byte o mesmo arquivo que o Android já sabe abrir.
- `derivacaoDeChaveEhIdenticaNasDuasPlataformas` fixa o resultado do PBKDF2, conferido também
  contra uma terceira implementação independente (`hashlib.pbkdf2_hmac` do CPython/OpenSSL).

Qualquer divergência de KDF, ordem de campos, escaping ou codificação de senha quebra um desses
testes.

**Mudar o valor de `ARQUIVO_HEX` significa mudar o formato do arquivo** — isso exige subir
`FormatoBackup.VERSAO_FORMATO` e atualizar este documento.

---

## 7. Arquivos temporários e rede

- O arquivo é montado em memória e gravado em área temporária privada do app
  (`cacheDir/backup` no Android, `NSTemporaryDirectory()/savro-backup` no iOS) apenas para ser
  entregue ao seletor nativo.
- O temporário é removido em **qualquer** desfecho: sucesso, cancelamento pelo usuário ou erro
  (bloco `finally`). Coberto por três testes específicos.
- **Zero acesso a rede** durante todo o fluxo. O módulo `:shared:core:backup` não declara nenhuma
  dependência de HTTP, e a verificação de fronteiras (`verifyArchitecture`) impede a introdução de
  uma sem passar por revisão de arquitetura.

---

## 8. Histórico de versões do formato

| Versão | Data | Mudança |
|---|---|---|
| 1 | 2026-07 (#121) | Versão inicial: PBKDF2-HMAC-SHA1 + AES-256-GCM, corpo em JSON canônico. |
