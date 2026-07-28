# Revisão do backup/exportação (#121) sob a ótica da #130

Revisão pontual — a especificação normativa completa é
`documentacao/arquitetura/formato-savrobackup.md`. Este documento **não altera** o formato V1;
registra a checagem de cada requisito da issue #130 contra a implementação real e diz
explicitamente se algo precisaria mudar (nada precisou).

## Checklist da issue #130 aplicado ao formato V1

| Requisito da #130 | Verificado em | Resultado |
|---|---|---|
| Ausência de API privada da Apple | `CriptografiaBackup.kt` (Kdoc), `CriptografiaBackup.android.kt`, código real do CI (`aplicativo-ci.yml`, step "Confirmar ausência de símbolo privado do CommonCrypto") | ✅ AES-256-CTR + HMAC-SHA256 via API pública (`kCCModeCTR`, `CCHmac`) — `kCCModeGCM`/SPI privada explicitamente rejeitados (PR #228, decisão do Luiz). CI já valida via `nm`/`strings` no framework linkado, não é suposição. |
| KDF e parâmetros versionados | `FormatoBackup.kt` (`idKdf`, `iteracoesKdf` no cabeçalho) | ✅ PBKDF2-HMAC-SHA256, 600.000 iterações padrão gravadas no arquivo, teto de leitura de 10.000.000 contra DoS. |
| Encrypt-then-MAC | `CriptografiaBackup.kt`, `FormatoBackup.ID_CIFRA_AES_256_CTR_HMAC_SHA256` | ✅ Tag HMAC-SHA256 calculada sobre cabeçalho + ciphertext, verificada antes de decifrar (verify-then-decrypt), comparação em tempo constante (`MessageDigest.isEqual`/XOR-OR sem saída antecipada). |
| Subchaves separadas | `FormatoBackup.TAMANHO_CHAVE = 64` (32 cifra + 32 MAC) | ✅ Uma única derivação, duas subchaves explicitamente distintas — nenhuma reaproveita a mesma chave para cifrar e autenticar. |
| Nonce exclusivo | `FormatoBackup.TAMANHO_NONCE = 16`, gerado por `SecureRandom`/`SecRandomCopyBytes` a cada arquivo | ✅ Nunca há reuso de par (chave, nonce) — o salt também muda a cada arquivo. |
| Autenticação de cabeçalho | `CabecalhoBackup.kt` + `CriptografiaBackup` | ✅ Os 52 bytes do cabeçalho entram como dados autenticados; baixar `iteracoesKdf` ou trocar `salt` invalida a tag. |
| Verify-then-decrypt | `CriptografiaBackup.decifrar()` | ✅ Confirmado no Kdoc e na ordem de chamadas de `CodecArquivoBackup.abrir()`. |
| Limpeza de temporários | `ServicoBackup.entregarAoSeletor()` (`finally { areaTemporaria.remover(caminho) }`) | ✅ Removido em qualquer desfecho — sucesso, cancelamento, exceção. Três testes específicos citados em `formato-savrobackup.md` §7. |
| Rollback | `ServicoBackup.aplicarRestauracao()` + `repositorio.executarEmTransacao` | ✅ Uma única transação de banco; qualquer falha no meio reverte tudo. Testado (`ServicoBackupTest`, `falharNaInsercaoDeNumero`). |
| Mensagens genéricas | `ErroBackup.ArquivoInvalido` | ✅ Senha errada, byte adulterado, corpo truncado e conteúdo inconsistente convergem para o mesmo erro, de propósito. |
| CSV identificado como não cifrado | `ExportadorCsv.kt` (Kdoc) + aviso na UI antes de exportar | ✅ Texto claro por definição, documentado explicitamente como tal. |

## Achados desta revisão

**Nenhuma falha nova foi encontrada no formato V1.** A implementação já cobre, com evidência real
(código + teste automatizado), todos os itens que a issue #130 pede para revisar. A única mudança
de código feita nesta issue relacionada ao backup é a correção de redaction do `toString()` de
`ConteudoBackup` (ver `contrato-redaction-savro.md`) — **não é uma mudança de formato**, não afeta
um único byte do arquivo `*.savrobackup` gerado ou lido (confirmado por leitura de
`SerializadorBackup.kt`/`JsonCanonico.kt`, que serializam campo a campo e nunca usam `toString()`).

## Achado relacionado, fora do escopo do formato do backup, dentro do escopo da persistência (#180)

Ver `modelo-ameacas-savro.md` seção 2 e a matriz de dados (linha "Backup automático do SO
(iCloud/iTunes, iOS)"): o arquivo físico `savro.db` no iOS (não o `*.savrobackup` — são coisas
diferentes) não tem exclusão explícita de backup do sistema (`NSURLIsExcludedFromBackupKey`) hoje.
Isso não é uma falha do formato `*.savrobackup` da #121; é uma lacuna da implementação de
persistência da #180 no lado iOS, registrada aqui porque foi encontrada durante esta auditoria de
segurança. Recomendação e justificativa completa no resumo executivo desta issue — não implementada
nesta auditoria por falta de toolchain macOS para validar localmente antes de propor o código.

## Conclusão

Não é necessário nenhum fix ao formato `*.savrobackup` V1. A regra "não altere o formato V1 sem
achar falha concreta e documentada" foi respeitada — a única mudança tocando o módulo
`:shared:core:backup` (a redação do `toString()` de `ConteudoBackup`) foi feita, documentada e
separada explicitamente do restante do formato, exatamente como a instrução desta issue pediu.
