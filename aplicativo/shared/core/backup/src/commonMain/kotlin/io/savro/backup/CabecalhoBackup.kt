package io.savro.backup

import io.savro.common.Resultado

/**
 * Cabeçalho em texto claro do arquivo `*.savrobackup` — ver o mapa de bytes em [FormatoBackup].
 *
 * Nenhum campo aqui é dado do usuário: são só os parâmetros necessários para tentar abrir o
 * arquivo. Todos eles entram como dados autenticados pelo HMAC, então adulterar qualquer um
 * invalida a tag de autenticação.
 */
data class CabecalhoBackup(
    val versaoFormato: Int,
    val versaoEsquema: Int,
    val idKdf: Int,
    val iteracoesKdf: Int,
    val idCifra: Int,
    val salt: ByteArray,
    val nonce: ByteArray,
) {
    fun paraBytes(): ByteArray {
        val bytes = ByteArray(FormatoBackup.TAMANHO_CABECALHO)
        FormatoBackup.MAGIA.copyInto(bytes, 0)
        bytes.escreverUInt16(8, versaoFormato)
        bytes.escreverUInt16(10, versaoEsquema)
        bytes[12] = idKdf.toByte()
        bytes.escreverUInt32(13, iteracoesKdf)
        bytes[17] = idCifra.toByte()
        bytes.escreverUInt16(18, 0)
        salt.copyInto(bytes, 20)
        nonce.copyInto(bytes, 20 + FormatoBackup.TAMANHO_SALT)
        return bytes
    }

    // ByteArray em data class exige equals/hashCode explícitos (identidade por referência é o
    // padrão da JVM e do Kotlin/Native) — os testes de vetor comparam cabeçalhos por valor.
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is CabecalhoBackup) return false
        return versaoFormato == other.versaoFormato &&
            versaoEsquema == other.versaoEsquema &&
            idKdf == other.idKdf &&
            iteracoesKdf == other.iteracoesKdf &&
            idCifra == other.idCifra &&
            salt.contentEquals(other.salt) &&
            nonce.contentEquals(other.nonce)
    }

    override fun hashCode(): Int {
        var resultado = versaoFormato
        resultado = 31 * resultado + versaoEsquema
        resultado = 31 * resultado + idKdf
        resultado = 31 * resultado + iteracoesKdf
        resultado = 31 * resultado + idCifra
        resultado = 31 * resultado + salt.contentHashCode()
        resultado = 31 * resultado + nonce.contentHashCode()
        return resultado
    }

    companion object {
        /**
         * Lê e valida o cabeçalho **antes** de qualquer derivação de chave, decifragem ou toque no
         * banco. [versaoEsquemaSuportada] é a versão de schema do app que está lendo.
         */
        fun ler(arquivo: ByteArray, versaoEsquemaSuportada: Int): Resultado<CabecalhoBackup, ErroBackup> {
            if (arquivo.size < FormatoBackup.TAMANHO_CABECALHO + FormatoBackup.TAMANHO_TAG) {
                return Resultado.Falha(ErroBackup.ArquivoInvalido)
            }
            for (indice in FormatoBackup.MAGIA.indices) {
                if (arquivo[indice] != FormatoBackup.MAGIA[indice]) {
                    return Resultado.Falha(ErroBackup.ArquivoInvalido)
                }
            }

            val versaoFormato = arquivo.lerUInt16(8)
            if (versaoFormato != FormatoBackup.VERSAO_FORMATO) {
                return Resultado.Falha(
                    ErroBackup.VersaoFormatoIncompativel(versaoFormato, FormatoBackup.VERSAO_FORMATO),
                )
            }

            val versaoEsquema = arquivo.lerUInt16(10)
            // Schema mais novo que o do app: restaurar jogaria fora campos que este app não
            // conhece. Schema mais antigo é aceito — o leitor de conteúdo aplica os padrões dos
            // campos que ainda não existiam (ver SerializadorBackup).
            if (versaoEsquema > versaoEsquemaSuportada || versaoEsquema < 1) {
                return Resultado.Falha(ErroBackup.EsquemaIncompativel(versaoEsquema, versaoEsquemaSuportada))
            }

            val idKdf = arquivo[12].toInt() and 0xFF
            val iteracoes = arquivo.lerUInt32(13)
            val idCifra = arquivo[17].toInt() and 0xFF
            if (idKdf != FormatoBackup.ID_KDF_PBKDF2_HMAC_SHA256 ||
                idCifra != FormatoBackup.ID_CIFRA_AES_256_CTR_HMAC_SHA256
            ) {
                return Resultado.Falha(ErroBackup.ArquivoInvalido)
            }
            if (iteracoes < 1 || iteracoes > FormatoBackup.ITERACOES_MAXIMAS_ACEITAS) {
                return Resultado.Falha(ErroBackup.ArquivoInvalido)
            }

            return Resultado.Sucesso(
                CabecalhoBackup(
                    versaoFormato = versaoFormato,
                    versaoEsquema = versaoEsquema,
                    idKdf = idKdf,
                    iteracoesKdf = iteracoes,
                    idCifra = idCifra,
                    salt = arquivo.copyOfRange(20, 20 + FormatoBackup.TAMANHO_SALT),
                    nonce = arquivo.copyOfRange(
                        20 + FormatoBackup.TAMANHO_SALT,
                        20 + FormatoBackup.TAMANHO_SALT + FormatoBackup.TAMANHO_NONCE,
                    ),
                ),
            )
        }
    }
}

private fun ByteArray.escreverUInt16(posicao: Int, valor: Int) {
    this[posicao] = ((valor ushr 8) and 0xFF).toByte()
    this[posicao + 1] = (valor and 0xFF).toByte()
}

private fun ByteArray.escreverUInt32(posicao: Int, valor: Int) {
    this[posicao] = ((valor ushr 24) and 0xFF).toByte()
    this[posicao + 1] = ((valor ushr 16) and 0xFF).toByte()
    this[posicao + 2] = ((valor ushr 8) and 0xFF).toByte()
    this[posicao + 3] = (valor and 0xFF).toByte()
}

private fun ByteArray.lerUInt16(posicao: Int): Int =
    ((this[posicao].toInt() and 0xFF) shl 8) or (this[posicao + 1].toInt() and 0xFF)

private fun ByteArray.lerUInt32(posicao: Int): Int =
    ((this[posicao].toInt() and 0xFF) shl 24) or
        ((this[posicao + 1].toInt() and 0xFF) shl 16) or
        ((this[posicao + 2].toInt() and 0xFF) shl 8) or
        (this[posicao + 3].toInt() and 0xFF)
