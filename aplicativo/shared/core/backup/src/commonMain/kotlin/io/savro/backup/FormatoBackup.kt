package io.savro.backup

import io.savro.domain.patrimonio.calculo.FormatadorData

/**
 * Constantes canônicas do formato `*.savrobackup` (issue #121).
 *
 * O formato é **descrito por escrito** em `documentacao/arquitetura/formato-savrobackup.md`; este
 * arquivo é a única implementação dele, compartilhada por Android e iOS (`commonMain`) — nenhuma
 * plataforma reimplementa cabeçalho, ordem de campos ou parâmetros.
 *
 * Cabeçalho (48 bytes, em texto claro, big-endian):
 * ```
 * 0..7    magia            "SAVROBK1" (ASCII)
 * 8..9    versaoFormato    uint16
 * 10..11  versaoEsquema    uint16
 * 12      idKdf            uint8
 * 13..16  iteracoesKdf     uint32
 * 17      idCifra          uint8
 * 18..19  reservado        uint16 (sempre 0)
 * 20..35  salt             16 bytes
 * 36..47  nonce            12 bytes
 * 48..N   AES-256-GCM(conteudo) || tag(16)
 * ```
 * Os 48 bytes do cabeçalho entram como dados autenticados adicionais (AAD) da cifra: alterar
 * qualquer campo do cabeçalho — inclusive baixar `iteracoesKdf` para tentar enfraquecer a
 * derivação — invalida a tag e o arquivo é recusado.
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
    const val TAMANHO_CABECALHO = 48
    const val TAMANHO_MAGIA = 8
    const val TAMANHO_SALT = 16
    const val TAMANHO_NONCE = 12
    const val TAMANHO_TAG = 16
    const val TAMANHO_CHAVE = 32

    /** PBKDF2-HMAC-SHA1, RFC 8018. Ver `formato-savrobackup.md` para o motivo do PRF SHA-1. */
    const val ID_KDF_PBKDF2_HMAC_SHA1 = 1

    /** AES-256-GCM com tag de 128 bits (NIST SP 800-38D). */
    const val ID_CIFRA_AES_256_GCM = 1

    /**
     * Recomendação OWASP para PBKDF2-HMAC-SHA1 (Password Storage Cheat Sheet). Fica gravado no
     * arquivo: um backup antigo continua abrindo com o número de iterações dele, e subir este
     * padrão no futuro não invalida nada já gerado.
     */
    const val ITERACOES_PADRAO = 1_300_000

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
