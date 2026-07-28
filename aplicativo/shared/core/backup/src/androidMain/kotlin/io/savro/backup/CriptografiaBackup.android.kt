package io.savro.backup

import java.security.GeneralSecurityException
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec
import org.bouncycastle.crypto.digests.SHA256Digest
import org.bouncycastle.crypto.generators.PKCS5S2ParametersGenerator
import org.bouncycastle.crypto.params.KeyParameter

/**
 * Implementação Android da fronteira criptográfica do backup (#121). Ver a docstring do `expect
 * object` em `CriptografiaBackup.kt` para a construção *encrypt-then-MAC* completa (motivo de não
 * ser GCM) — este arquivo só orquestra:
 *
 * - **KDF:** PBKDF2-HMAC-SHA256 via a API leve do Bouncy Castle (`PKCS5S2ParametersGenerator` +
 *   `SHA256Digest`), **não** via `SecretKeyFactory`/`Security.addProvider`. Dois motivos: (1)
 *   `SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")` só existe a partir da API 26 no
 *   provedor do sistema, e o app suporta `minSdk = 23`; (2) registrar o Bouncy Castle como
 *   provedor JCA global (`Security.addProvider(BouncyCastleProvider())`) conflita com a versão
 *   reduzida de BC que o próprio Android já embute sob o nome `"BC"` para verificação de
 *   certificados — um problema documentado e conhecido do ecossistema Android. A API leve
 *   (`PKCS5S2ParametersGenerator`) roda os bytes diretamente, sem passar pelo registro de
 *   provedores, sem esse risco.
 * - **Cifra:** `AES/CTR/NoPadding` (JCA/Conscrypt), disponível em todos os níveis de API
 *   suportados — ao contrário do GCM, o CTR nunca foi um problema de disponibilidade aqui; a
 *   mudança de GCM para CTR+HMAC é só para manter os dois lados (Android e iOS) na mesma
 *   construção, já que o iOS não consegue GCM sem SPI privada (ver decisão no PR #228).
 * - **MAC:** `HmacSHA256` (JCA), padrão em qualquer nível de API.
 *
 * A comparação da tag no caminho de decifragem usa `MessageDigest.isEqual`, a API pública do JDK
 * feita especificamente para comparação em tempo constante — não uma comparação escrita à mão.
 */
internal actual object CriptografiaBackup {

    private val aleatorio = SecureRandom()

    actual fun bytesAleatorios(quantidade: Int): ByteArray =
        ByteArray(quantidade).also(aleatorio::nextBytes)

    actual fun derivarChave(
        senhaAscii: String,
        salt: ByteArray,
        iteracoes: Int,
        tamanhoBytes: Int,
    ): ByteArray {
        val senhaBytes = senhaAscii.encodeToByteArray()
        return try {
            val gerador = PKCS5S2ParametersGenerator(SHA256Digest())
            gerador.init(senhaBytes, salt, iteracoes)
            val parametros = gerador.generateDerivedParameters(tamanhoBytes * 8) as KeyParameter
            parametros.key
        } finally {
            // Não existe um `clearPassword()` equivalente ao PBEKeySpec na API leve do BC — zera a
            // cópia que este método controla (#121: "limpar buffers sensíveis quando a plataforma
            // permitir").
            senhaBytes.fill(0)
        }
    }

    actual fun cifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        texto: ByteArray,
    ): ByteArray {
        val (chaveCifra, chaveMac) = subchaves(chave)
        val cifrador = Cipher.getInstance(TRANSFORMACAO_CIFRA)
        cifrador.init(Cipher.ENCRYPT_MODE, SecretKeySpec(chaveCifra, "AES"), IvParameterSpec(nonce))
        val ciphertext = cifrador.doFinal(texto)
        val tag = hmacSha256(chaveMac, dadosAutenticados, ciphertext)
        return ciphertext + tag
    }

    actual fun decifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        cifra: ByteArray,
    ): ByteArray? {
        if (cifra.size < FormatoBackup.TAMANHO_TAG) return null
        val (chaveCifra, chaveMac) = subchaves(chave)
        val ciphertext = cifra.copyOfRange(0, cifra.size - FormatoBackup.TAMANHO_TAG)
        val tagRecebida = cifra.copyOfRange(cifra.size - FormatoBackup.TAMANHO_TAG, cifra.size)
        val tagCalculada = hmacSha256(chaveMac, dadosAutenticados, ciphertext)

        // Verifica a tag ANTES de decifrar (verify-then-decrypt) e em tempo constante:
        // `MessageDigest.isEqual` é desenhado pelo próprio JDK para essa comparação.
        if (!MessageDigest.isEqual(tagCalculada, tagRecebida)) return null

        return try {
            val cifrador = Cipher.getInstance(TRANSFORMACAO_CIFRA)
            cifrador.init(Cipher.DECRYPT_MODE, SecretKeySpec(chaveCifra, "AES"), IvParameterSpec(nonce))
            cifrador.doFinal(ciphertext)
        } catch (excecao: GeneralSecurityException) {
            // Corpo com tamanho inválido para o modo de cifra: um único caminho de falha, sem log e
            // sem distinção (ver ErroBackup.ArquivoInvalido).
            null
        }
    }

    /** `chave[0..31]` cifra, `chave[32..63]` autentica — nunca a mesma subchave para as duas coisas. */
    private fun subchaves(chave: ByteArray): Pair<ByteArray, ByteArray> {
        val metade = FormatoBackup.TAMANHO_CHAVE / 2
        return chave.copyOfRange(0, metade) to chave.copyOfRange(metade, chave.size)
    }

    private fun hmacSha256(chaveMac: ByteArray, vararg partes: ByteArray): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(chaveMac, "HmacSHA256"))
        partes.forEach(mac::update)
        return mac.doFinal()
    }

    private const val TRANSFORMACAO_CIFRA = "AES/CTR/NoPadding"
}
