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
import platform.CoreCrypto.CCCryptorFinal
import platform.CoreCrypto.CCCryptorRefVar
import platform.CoreCrypto.CCCryptorRelease
import platform.CoreCrypto.CCCryptorUpdate
import platform.CoreCrypto.CCHmac
import platform.CoreCrypto.CCKeyDerivationPBKDF
import platform.CoreCrypto.CCOperation
import platform.CoreCrypto.ccNoPadding
import platform.CoreCrypto.kCCAlgorithmAES
import platform.CoreCrypto.kCCDecrypt
import platform.CoreCrypto.kCCEncrypt
import platform.CoreCrypto.kCCHmacAlgSHA256
import platform.CoreCrypto.kCCModeCTR
import platform.CoreCrypto.kCCPBKDF2
import platform.CoreCrypto.kCCPRFHmacAlgSHA256
import platform.CoreCrypto.kCCSuccess
import platform.Security.SecRandomCopyBytes
import platform.Security.kSecRandomDefault
import platform.posix.size_tVar

/**
 * Implementação iOS da fronteira criptográfica do backup (#121). Ver a docstring do `expect
 * object` em `CriptografiaBackup.kt` para a construção *encrypt-then-MAC* completa — este arquivo
 * só orquestra CommonCrypto **público**:
 *
 * - **KDF:** `CCKeyDerivationPBKDF` com `kCCPRFHmacAlgSHA256` — PBKDF2-HMAC-SHA256, símbolo público
 *   de `CommonKeyDerivation.h` desde sempre (não é o gargalo: o gargalo era só o Android antes da
 *   API 26).
 * - **Cifra:** `CCCryptorCreateWithMode` com `mode = kCCModeCTR` — AES-256-CTR. `kCCModeCTR` (valor
 *   4 do enum `CCMode`) é público em `CommonCryptor.h`, ao contrário de `kCCModeGCM` (valor 11, só
 *   em `CommonCryptorSPI.h`, SPI privada da Apple). É exatamente por isso que a versão anterior
 *   deste arquivo (commit `5f69690`) resolvia símbolos via `dlsym`: o binding padrão do
 *   Kotlin/Native para CommonCrypto não expõe `CCCryptorGCMAddIV`/`CCCryptorGCMAddAAD`/
 *   `CCCryptorGCMFinal` nem `kCCModeGCM`, porque eles não fazem parte do module map público. Essa
 *   abordagem foi revertida por decisão do Luiz (ver PR #228): interface privada não é aceitável
 *   num app destinado à App Store, mesmo funcionando em runtime. A troca de GCM por
 *   AES-256-CTR + HMAC-SHA256 elimina a dependência de SPI por completo — nenhum símbolo é
 *   resolvido em runtime, tudo é resolvido em tempo de compilação pelo binding padrão.
 * - **MAC:** `CCHmac` com `kCCHmacAlgSHA256` — símbolo público de `CommonHMAC.h`.
 *
 * A comparação da tag no caminho de decifragem é feita em tempo constante: comparar com saída
 * antecipada vazaria, por temporização, quantos bytes da tag conferem.
 */
@OptIn(ExperimentalForeignApi::class)
internal actual object CriptografiaBackup {

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
            prf = kCCPRFHmacAlgSHA256,
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
        val (chaveCifra, chaveMac) = subchaves(chave)
        try {
            val ciphertext = executarCtr(kCCEncrypt, chaveCifra, nonce, texto)
            val tag = hmacSha256(chaveMac, dadosAutenticados, ciphertext)
            return ciphertext + tag
        } finally {
            chaveCifra.fill(0)
            chaveMac.fill(0)
        }
    }

    actual fun decifrar(
        chave: ByteArray,
        nonce: ByteArray,
        dadosAutenticados: ByteArray,
        cifra: ByteArray,
    ): ByteArray? {
        if (cifra.size < FormatoBackup.TAMANHO_TAG) return null
        val (chaveCifra, chaveMac) = subchaves(chave)
        try {
            val ciphertext = cifra.copyOfRange(0, cifra.size - FormatoBackup.TAMANHO_TAG)
            val tagEsperada = cifra.copyOfRange(cifra.size - FormatoBackup.TAMANHO_TAG, cifra.size)
            val tagCalculada = hmacSha256(chaveMac, dadosAutenticados, ciphertext)

            // Verifica a tag ANTES de decifrar (verify-then-decrypt), em tempo constante.
            if (!iguaisEmTempoConstante(tagCalculada, tagEsperada)) return null

            return runCatching { executarCtr(kCCDecrypt, chaveCifra, nonce, ciphertext) }.getOrNull()
        } finally {
            chaveCifra.fill(0)
            chaveMac.fill(0)
        }
    }

    /** `chave[0..31]` cifra, `chave[32..63]` autentica — nunca a mesma subchave para as duas coisas. */
    private fun subchaves(chave: ByteArray): Pair<ByteArray, ByteArray> {
        val metade = FormatoBackup.TAMANHO_CHAVE / 2
        return chave.copyOfRange(0, metade) to chave.copyOfRange(metade, chave.size)
    }

    private fun executarCtr(
        operacao: CCOperation,
        chaveCifra: ByteArray,
        nonce: ByteArray,
        entrada: ByteArray,
    ): ByteArray = memScoped {
        val referencia = alloc<CCCryptorRefVar>()
        val saida = ByteArray(entrada.size)

        var estado = chaveCifra.usePinned { chaveFixada ->
            nonce.usePinned { nonceFixada ->
                CCCryptorCreateWithMode(
                    op = operacao.convert(),
                    mode = kCCModeCTR,
                    alg = kCCAlgorithmAES,
                    padding = ccNoPadding,
                    iv = nonceFixada.addressOf(0),
                    key = chaveFixada.addressOf(0),
                    keyLength = chaveCifra.size.convert(),
                    tweak = null,
                    tweakLength = 0.convert(),
                    numRounds = 0,
                    options = 0.convert(),
                    cryptorRef = referencia.ptr,
                )
            }
        }
        check(estado == kCCSuccess) { "CCCryptorCreateWithMode falhou" }
        val cryptor = requireNotNull(referencia.value) { "CCCryptorRef nulo" }

        try {
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

            // AES-CTR sem padding não deixa resto para o Final flusar (ao contrário de CBC com
            // padding) — a chamada existe só para fechar o ciclo de vida documentado da Apple
            // (Create -> Update -> Final -> Release) e continua sendo API pública, não a SPI de GCM.
            val movidosFinal = alloc<size_tVar>()
            movidosFinal.value = 0.convert()
            estado = CCCryptorFinal(cryptor, null, 0.convert(), movidosFinal.ptr)
            check(estado == kCCSuccess) { "CCCryptorFinal falhou" }
        } finally {
            CCCryptorRelease(cryptor)
        }
        saida
    }

    private fun hmacSha256(chaveMac: ByteArray, vararg partes: ByteArray): ByteArray {
        val entrada = partes.fold(ByteArray(0)) { acumulado, parte -> acumulado + parte }
        try {
            val mac = ByteArray(FormatoBackup.TAMANHO_TAG)
            chaveMac.usePinned { chaveFixada ->
                entrada.usePinned { entradaFixada ->
                    mac.usePinned { macFixada ->
                        CCHmac(
                            algorithm = kCCHmacAlgSHA256,
                            key = chaveFixada.addressOf(0),
                            keyLength = chaveMac.size.convert(),
                            data = if (entrada.isEmpty()) null else entradaFixada.addressOf(0),
                            dataLength = entrada.size.convert(),
                            macOut = macFixada.addressOf(0),
                        )
                    }
                }
            }
            return mac
        } finally {
            // `entrada` é o cabeçalho + ciphertext completos concatenados num único ByteArray
            // intermediário (o binding padrão de CCHmac não aceita partes separadas como o
            // `Mac.update` incremental do Android) — zera assim que o HMAC já foi calculado.
            entrada.fill(0)
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
