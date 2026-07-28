package io.savro.backup

import io.savro.domain.patrimonio.calculo.FormatadorData

/**
 * Constantes canônicas do formato `*.savrobackup` (issue #121).
 *
 * O formato é **descrito por escrito** em `documentacao/arquitetura/formato-savrobackup.md`; este
 * arquivo é a única implementação dele, compartilhada por Android e iOS (`commonMain`) — nenhuma
 * plataforma reimplementa cabeçalho, ordem de campos ou parâmetros.
 *
 * Cabeçalho (52 bytes, em texto claro, big-endian):
 * ```
 * 0..7    magia            "SAVROBK1" (ASCII)
 * 8..9    versaoFormato    uint16
 * 10..11  versaoEsquema    uint16
 * 12      idKdf            uint8
 * 13..16  iteracoesKdf     uint32
 * 17      idCifra          uint8
 * 18..19  reservado        uint16 (sempre 0)
 * 20..35  salt             16 bytes
 * 36..51  nonce/IV         16 bytes (contador inicial do AES-CTR)
 * 52..N   AES-256-CTR(conteudo) || tag HMAC-SHA256(32)
 * ```
 * Os 52 bytes do cabeçalho entram como dados autenticados da construção *encrypt-then-MAC*
 * (`tag = HMAC-SHA256(chaveMac, cabecalho || ciphertext)`): alterar qualquer campo do cabeçalho —
 * inclusive baixar `iteracoesKdf` para tentar enfraquecer a derivação — invalida a tag e o
 * arquivo é recusado.
 *
 * O cabeçalho não carrega nenhum dado do usuário (nem data do backup, nem quantidade de itens):
 * tudo isso vive dentro da parte cifrada, e a prévia da restauração só existe depois de a senha
 * ter autenticado o arquivo.
 */
object FormatoBackup {

    /** "SAVROBK1" — muda junto com [VERSAO_FORMATO] se um dia o layout do cabeçalho mudar. */
    val MAGIA: ByteArray = byteArrayOf(0x53, 0x41, 0x56, 0x52, 0x4F, 0x42, 0x4B, 0x31)

    const val EXTENSAO_ARQUIVO = "savrobackup"
    const val TIPO_MIME = "application/octet-stream"

    const val VERSAO_FORMATO = 1
    const val TAMANHO_CABECALHO = 52
    const val TAMANHO_MAGIA = 8
    const val TAMANHO_SALT = 16

    /** IV/contador do AES-CTR — precisa ocupar o bloco inteiro de 16 bytes (tamanho de bloco do AES). */
    const val TAMANHO_NONCE = 16

    /** Tag HMAC-SHA256 completa (32 bytes) — construção *encrypt-then-MAC*, não trunca o MAC. */
    const val TAMANHO_TAG = 32

    /**
     * Saída do KDF: 64 bytes = 32 (chave AES-256, `chave[0..31]`) + 32 (chave HMAC-SHA256,
     * `chave[32..63]`). As duas subchaves são explicitamente distintas — nenhuma das duas
     * implementações de plataforma reaproveita a mesma chave para cifrar e autenticar.
     */
    const val TAMANHO_CHAVE = 64

    /** PBKDF2-HMAC-SHA256, RFC 8018. Ver `formato-savrobackup.md` para o histórico da decisão. */
    const val ID_KDF_PBKDF2_HMAC_SHA256 = 1

    /**
     * *Encrypt-then-MAC*: AES-256-CTR + HMAC-SHA256, com subchaves distintas derivadas do mesmo
     * KDF (ver [TAMANHO_CHAVE]). Não é AEAD de biblioteca única (não é GCM) — é uma composição de
     * duas primitivas públicas e amplamente auditadas, escolhida porque o binding padrão do
     * Kotlin/Native para CommonCrypto não expõe modo GCM (SPI privada da Apple, ver
     * `formato-savrobackup.md` §3.2). Nenhuma primitiva é implementada pelo Savro: só orquestração
     * de `AES/CTR/NoPadding` + `HmacSHA256` (JCA/Conscrypt no Android) e `CCCryptorCreateWithMode` +
     * `CCHmac` (CommonCrypto público no iOS).
     */
    const val ID_CIFRA_AES_256_CTR_HMAC_SHA256 = 1

    /**
     * Recomendação OWASP (Password Storage Cheat Sheet) para PBKDF2-HMAC-SHA256. Fica gravado no
     * arquivo: um backup antigo continua abrindo com o número de iterações dele, e subir este
     * padrão no futuro não invalida nada já gerado.
     */
    const val ITERACOES_PADRAO = 600_000

    /**
     * Teto de sanidade na leitura: um arquivo adulterado pedindo bilhões de iterações travaria o
     * app antes mesmo de a tag ser verificada (a derivação vem antes da autenticação, por
     * construção do PBKDF2). Não é um piso de segurança — é proteção contra negação de serviço.
     */
    const val ITERACOES_MAXIMAS_ACEITAS = 10_000_000

    /** Mínimo exigido na criação do backup. Senha curta não protege arquivo que sai do aparelho. */
    const val TAMANHO_MINIMO_SENHA = 8

    fun nomeDeArquivoSugerido(dataEpocaMs: Long): String =
        "savro-${FormatadorData.paraDataDeArquivo(dataEpocaMs)}.$EXTENSAO_ARQUIVO"
}
