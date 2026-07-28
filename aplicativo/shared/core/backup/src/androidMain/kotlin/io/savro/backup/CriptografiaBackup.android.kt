package io.savro.backup

import java.security.GeneralSecurityException
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * Implementação Android da fronteira criptográfica do backup (#121). Só chama JCA — nenhuma
 * primitiva escrita à mão, nenhuma dependência nova: `AES/GCM/NoPadding` e
 * `PBKDF2WithHmacSHA1` já vêm do provedor do sistema (Conscrypt/BoringSSL nas versões atuais,
 * Bouncy Castle nas antigas) em todos os níveis de API suportados (`minSdk = 23`).
 *
 * Por que HMAC-SHA1 e não HMAC-SHA256 no PBKDF2: `SecretKeyFactory` só oferece
 * `PBKDF2WithHmacSHA256` a partir da API 26, e o app suporta API 23. Um formato cuja chave depende
 * da versão do Android quebraria o critério de aceite de interoperabilidade (o mesmo arquivo tem
 * que abrir em qualquer aparelho). HMAC-SHA1 permanece seguro como PRF — os ataques conhecidos ao
 * SHA-1 são de colisão e não se aplicam a HMAC — e o custo é compensado pelas 1.300.000 iterações
 * recomendadas pela OWASP para esse PRF. O id do KDF está gravado no arquivo: quando o `minSdk`
 * subir para 26, um `idKdf = 2` com HMAC-SHA256 convive com os arquivos já gerados.
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
        val especificacao = PBEKeySpec(senhaAscii.toCharArray(), salt, iteracoes, tamanhoBytes * 8)
        return try {
            SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1").generateSecret(especificacao).encoded
        } finally {
            // Limpa a cópia interna da senha mantida pelo PBEKeySpec (#121: "limpar buffers
            // sensíveis da memória quando a plataforma permitir").
            especificacao.clearPassword()
        }
    }

    actual fun cifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        texto: ByteArray,
    ): ByteArray {
        val cifrador = Cipher.getInstance(TRANSFORMACAO)
        val chaveSecreta = SecretKeySpec(chave, "AES")
        cifrador.init(Cipher.ENCRYPT_MODE, chaveSecreta, GCMParameterSpec(TAMANHO_TAG_BITS, nonce))
        cifrador.updateAAD(dadosAutenticados)
        return cifrador.doFinal(texto)
    }

    actual fun decifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        cifra: ByteArray,
    ): ByteArray? = try {
        val cifrador = Cipher.getInstance(TRANSFORMACAO)
        cifrador.init(
            Cipher.DECRYPT_MODE,
            SecretKeySpec(chave, "AES"),
            GCMParameterSpec(TAMANHO_TAG_BITS, nonce),
        )
        cifrador.updateAAD(dadosAutenticados)
        cifrador.doFinal(cifra)
    } catch (excecao: GeneralSecurityException) {
        // Tag inválida, cifra truncada, chave errada: um único caminho de falha, sem log e sem
        // distinção — o motivo real nunca chega a quem chamou (ver ErroBackup.ArquivoInvalido).
        null
    } catch (excecao: IllegalArgumentException) {
        // Alguns provedores recusam entrada menor que a tag por aqui em vez de AEADBadTagException.
        null
    }

    private const val TRANSFORMACAO = "AES/GCM/NoPadding"
    private const val TAMANHO_TAG_BITS = 128
}
