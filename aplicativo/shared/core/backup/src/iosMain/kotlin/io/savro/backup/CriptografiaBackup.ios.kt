package io.savro.backup

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.alloc
import kotlinx.cinterop.convert
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.refTo
import kotlinx.cinterop.usePinned
import kotlinx.cinterop.value
import platform.CoreCrypto.CCCryptorCreateWithMode
import platform.CoreCrypto.CCCryptorGCMAddAAD
import platform.CoreCrypto.CCCryptorGCMAddIV
import platform.CoreCrypto.CCCryptorGCMFinal
import platform.CoreCrypto.CCCryptorRefVar
import platform.CoreCrypto.CCCryptorRelease
import platform.CoreCrypto.CCCryptorUpdate
import platform.CoreCrypto.CCKeyDerivationPBKDF
import platform.CoreCrypto.ccNoPadding
import platform.CoreCrypto.kCCAlgorithmAES
import platform.CoreCrypto.kCCDecrypt
import platform.CoreCrypto.kCCEncrypt
import platform.CoreCrypto.kCCModeGCM
import platform.CoreCrypto.kCCPBKDF2
import platform.CoreCrypto.kCCPRFHmacAlgSHA1
import platform.CoreCrypto.kCCSuccess
import platform.Security.SecRandomCopyBytes
import platform.Security.kSecRandomDefault
import platform.posix.size_tVar

/**
 * Implementação iOS da fronteira criptográfica do backup (#121), sobre CommonCrypto — a mesma
 * biblioteca do sistema que o restante da plataforma usa. Nenhuma primitiva é escrita aqui: só
 * chamadas a `CCKeyDerivationPBKDF` (PBKDF2-HMAC-SHA1) e ao modo GCM do `CCCryptor`
 * (AES-256-GCM), com os mesmos parâmetros que o lado Android — o arquivo é o mesmo dos dois
 * lados, byte a byte.
 *
 * A comparação da tag no caminho de decifragem é feita em tempo constante: comparar com saída
 * antecipada vazaria, por temporização, quantos bytes da tag conferem.
 */
@OptIn(ExperimentalForeignApi::class)
internal actual object CriptografiaBackup {

    private const val TAMANHO_TAG = 16

    actual fun bytesAleatorios(quantidade: Int): ByteArray {
        val saida = ByteArray(quantidade)
        val estado = saida.usePinned { fixado ->
            SecRandomCopyBytes(kSecRandomDefault, quantidade.convert(), fixado.addressOf(0))
        }
        check(estado == 0) { "SecRandomCopyBytes falhou" }
        return saida
    }

    actual fun derivarChave(
        senhaAscii: String,
        salt: ByteArray,
        iteracoes: Int,
        tamanhoBytes: Int,
    ): ByteArray {
        val chave = ByteArray(tamanhoBytes)
        val estado = CCKeyDerivationPBKDF(
            algorithm = kCCPBKDF2,
            password = senhaAscii,
            passwordLen = senhaAscii.length.convert(),
            salt = salt.asUByteArray().refTo(0),
            saltLen = salt.size.convert(),
            prf = kCCPRFHmacAlgSHA1,
            rounds = iteracoes.convert(),
            derivedKey = chave.asUByteArray().refTo(0),
            derivedKeyLen = chave.size.convert(),
        )
        check(estado == kCCSuccess) { "CCKeyDerivationPBKDF falhou" }
        return chave
    }

    actual fun cifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        texto: ByteArray,
    ): ByteArray {
        val cifra = ByteArray(texto.size)
        val tag = ByteArray(TAMANHO_TAG)
        executarGcm(kCCEncrypt, chave, nonce, dadosAutenticados, texto, cifra, tag)
        return cifra + tag
    }

    actual fun decifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        cifra: ByteArray,
    ): ByteArray? {
        if (cifra.size < TAMANHO_TAG) return null
        val corpo = cifra.copyOfRange(0, cifra.size - TAMANHO_TAG)
        val tagEsperada = cifra.copyOfRange(cifra.size - TAMANHO_TAG, cifra.size)
        val texto = ByteArray(corpo.size)
        val tagCalculada = ByteArray(TAMANHO_TAG)

        val sucesso = runCatching {
            executarGcm(kCCDecrypt, chave, nonce, dadosAutenticados, corpo, texto, tagCalculada)
        }.isSuccess

        if (!sucesso || !iguaisEmTempoConstante(tagCalculada, tagEsperada)) {
            texto.fill(0)
            return null
        }
        return texto
    }

    private fun executarGcm(
        operacao: Int,
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        entrada: ByteArray,
        saida: ByteArray,
        tag: ByteArray,
    ) = memScoped {
        val referencia = alloc<CCCryptorRefVar>()
        var estado = chave.usePinned { chaveFixada ->
            CCCryptorCreateWithMode(
                op = operacao.convert(),
                mode = kCCModeGCM.convert(),
                alg = kCCAlgorithmAES,
                padding = ccNoPadding,
                iv = null,
                key = chaveFixada.addressOf(0),
                keyLength = chave.size.convert(),
                tweak = null,
                tweakLength = 0.convert(),
                numRounds = 0,
                options = 0.convert(),
                cryptorRef = referencia.ptr,
            )
        }
        check(estado == kCCSuccess) { "CCCryptorCreateWithMode falhou" }
        val cryptor = requireNotNull(referencia.value) { "CCCryptorRef nulo" }

        try {
            estado = nonce.usePinned { nonceFixado ->
                CCCryptorGCMAddIV(cryptor, nonceFixado.addressOf(0), nonce.size.convert())
            }
            check(estado == kCCSuccess) { "CCCryptorGCMAddIV falhou" }

            if (dadosAutenticados.isNotEmpty()) {
                estado = dadosAutenticados.usePinned { aadFixado ->
                    CCCryptorGCMAddAAD(cryptor, aadFixado.addressOf(0), dadosAutenticados.size.convert())
                }
                check(estado == kCCSuccess) { "CCCryptorGCMAddAAD falhou" }
            }

            if (entrada.isNotEmpty()) {
                val movidos = alloc<size_tVar>()
                estado = entrada.usePinned { entradaFixada ->
                    saida.usePinned { saidaFixada ->
                        CCCryptorUpdate(
                            cryptor,
                            entradaFixada.addressOf(0),
                            entrada.size.convert(),
                            saidaFixada.addressOf(0),
                            saida.size.convert(),
                            movidos.ptr,
                        )
                    }
                }
                check(estado == kCCSuccess) { "CCCryptorUpdate falhou" }
            }

            val tamanhoTag = alloc<size_tVar>()
            tamanhoTag.value = tag.size.convert()
            estado = tag.usePinned { tagFixada ->
                CCCryptorGCMFinal(cryptor, tagFixada.addressOf(0), tamanhoTag.ptr)
            }
            check(estado == kCCSuccess) { "CCCryptorGCMFinal falhou" }
        } finally {
            CCCryptorRelease(cryptor)
        }
    }

    private fun iguaisEmTempoConstante(esquerda: ByteArray, direita: ByteArray): Boolean {
        if (esquerda.size != direita.size) return false
        var diferenca = 0
        for (indice in esquerda.indices) {
            diferenca = diferenca or (esquerda[indice].toInt() xor direita[indice].toInt())
        }
        return diferenca == 0
    }
}
