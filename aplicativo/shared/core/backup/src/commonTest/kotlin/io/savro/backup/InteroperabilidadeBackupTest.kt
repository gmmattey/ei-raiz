package io.savro.backup

import io.savro.common.Resultado
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Evidência concreta de interoperabilidade Android <-> iOS (#121, critério de aceite).
 *
 * Esta classe vive em `commonTest` e roda **nas duas plataformas**: na JVM pelo
 * `:shared:core:backup:testDebugUnitTest` (job `testes-comuns` da CI) e no simulador iOS pelo
 * `:shared:core:backup:iosSimulatorArm64Test` (job `ios-xcode-macos`). Ver
 * [VetoresDeReferencia] para o que cada asserção prova em cada direção.
 */
class InteroperabilidadeBackupTest {

    @Test
    fun oArquivoDeReferenciaAbreNestaPlataforma() {
        val arquivo = VetoresDeReferencia.ARQUIVO_HEX.hexParaBytes()

        val resultado = CodecArquivoBackup.abrir(
            arquivo,
            VetoresDeReferencia.SENHA,
            VetoresDeReferencia.VERSAO_ESQUEMA,
        )

        assertTrue(resultado is Resultado.Sucesso, "backup de referência deveria abrir aqui")
        assertEquals(VetoresDeReferencia.conteudo().ordenado(), resultado.valor)
    }

    @Test
    fun regerarOArquivoDeReferenciaProduzOsMesmosBytes() {
        val resultado = CodecArquivoBackup.gerar(
            conteudo = VetoresDeReferencia.conteudo(),
            senha = VetoresDeReferencia.SENHA,
            iteracoesKdf = VetoresDeReferencia.ITERACOES,
            salt = VetoresDeReferencia.SALT,
            nonce = VetoresDeReferencia.NONCE,
        )

        assertTrue(resultado is Resultado.Sucesso)
        assertContentEquals(VetoresDeReferencia.ARQUIVO_HEX.hexParaBytes(), resultado.valor)
    }

    @Test
    fun senhaErradaNoArquivoDeReferenciaFalhaIgualNasDuasPlataformas() {
        val resultado = CodecArquivoBackup.abrir(
            VetoresDeReferencia.ARQUIVO_HEX.hexParaBytes(),
            VetoresDeReferencia.SENHA + "x",
            VetoresDeReferencia.VERSAO_ESQUEMA,
        )

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), resultado)
    }

    @Test
    fun cabecalhoDeReferenciaTemOsParametrosDocumentados() {
        val arquivo = VetoresDeReferencia.ARQUIVO_HEX.hexParaBytes()

        val resultado = CabecalhoBackup.ler(arquivo, VetoresDeReferencia.VERSAO_ESQUEMA)

        assertTrue(resultado is Resultado.Sucesso)
        val cabecalho = resultado.valor
        assertEquals(FormatoBackup.VERSAO_FORMATO, cabecalho.versaoFormato)
        assertEquals(VetoresDeReferencia.VERSAO_ESQUEMA, cabecalho.versaoEsquema)
        assertEquals(FormatoBackup.ID_KDF_PBKDF2_HMAC_SHA256, cabecalho.idKdf)
        assertEquals(FormatoBackup.ID_CIFRA_AES_256_CTR_HMAC_SHA256, cabecalho.idCifra)
        assertEquals(VetoresDeReferencia.ITERACOES, cabecalho.iteracoesKdf)
        assertContentEquals(VetoresDeReferencia.SALT, cabecalho.salt)
        assertContentEquals(VetoresDeReferencia.NONCE, cabecalho.nonce)
    }

    /**
     * A senha do vetor tem acento e aspas de propósito: é exatamente o caso em que provedores de
     * PBKDF2 divergem ao converter `char[]` em bytes. Este teste fixa a codificação canônica (hex
     * ASCII dos bytes UTF-8) nas duas plataformas.
     */
    @Test
    fun codificacaoDaSenhaEhIdenticaNasDuasPlataformas() {
        assertEquals(SENHA_EM_HEX, CodificadorSenha.paraAsciiHex(VetoresDeReferencia.SENHA))
    }

    @Test
    fun derivacaoDeChaveEhIdenticaNasDuasPlataformas() {
        val chave = CriptografiaBackup.derivarChave(
            senhaAscii = CodificadorSenha.paraAsciiHex(VetoresDeReferencia.SENHA),
            salt = VetoresDeReferencia.SALT,
            iteracoes = 1_000,
            tamanhoBytes = FormatoBackup.TAMANHO_CHAVE,
        )

        assertEquals(FormatoBackup.TAMANHO_CHAVE, chave.size)
        assertEquals(CHAVE_ESPERADA_HEX, chave.paraHex())
    }

    private companion object {
        /** Bytes UTF-8 de `sen#ha-Aç4o-"forte"` em hexadecimal ASCII. */
        const val SENHA_EM_HEX = "73656e2368612d41c3a7346f2d22666f72746522"

        /**
         * PBKDF2-HMAC-SHA256([SENHA_EM_HEX], `VetoresDeReferencia.SALT`, 1000 iterações, 64 bytes —
         * `chave[0..31]` cifra + `chave[32..63]` MAC). Valor conferido fora do projeto com
         * `hashlib.pbkdf2_hmac` (CPython/OpenSSL) — uma terceira implementação independente do
         * Bouncy Castle e do CommonCrypto.
         */
        const val CHAVE_ESPERADA_HEX =
            "c164307496488f3a1fa2d715e3d1667989a2a222345e922ee1bff80d96551c2" +
                "f39a12ecb97032aa486f35cc1e8db08d335a0bfbea9c5c9c590bf08becab91566"
    }
}
