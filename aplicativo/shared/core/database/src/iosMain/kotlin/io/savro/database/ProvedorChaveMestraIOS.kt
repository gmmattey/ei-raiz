package io.savro.database

import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.alloc
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.usePinned
import kotlinx.cinterop.value
import platform.CoreFoundation.CFDictionaryRef
import platform.CoreFoundation.CFTypeRef
import platform.CoreFoundation.CFTypeRefVar
import platform.Foundation.NSData
import platform.Foundation.NSMutableDictionary
import platform.Foundation.NSString
import platform.Foundation.create
import platform.Security.SecItemAdd
import platform.Security.SecItemCopyMatching
import platform.Security.SecItemDelete
import platform.Security.SecRandomCopyBytes
import platform.Security.errSecItemNotFound
import platform.Security.errSecSuccess
import platform.Security.kSecAttrAccessible
import platform.Security.kSecAttrAccessibleWhenUnlockedThisDeviceOnly
import platform.Security.kSecAttrAccount
import platform.Security.kSecAttrService
import platform.Security.kSecAttrSynchronizable
import platform.Security.kSecClass
import platform.Security.kSecClassGenericPassword
import platform.Security.kSecMatchLimit
import platform.Security.kSecMatchLimitOne
import platform.Security.kSecRandomDefault
import platform.Security.kSecReturnData
import platform.Security.kSecValueData
import platform.posix.memcpy

/**
 * [ProvedorChaveMestra] iOS: passphrase aleatória de 256 bits gerada uma vez, guardada no
 * Keychain como `kSecClassGenericPassword`, com `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
 * (exige aparelho desbloqueado, nunca sincroniza para o iCloud Keychain) — ver ADR-002, seção
 * "Estratégia para Keystore, Keychain e LocalAuthentication", e #180.
 *
 * Diferente do Android, o Keychain por si só já cifra o item em repouso com material derivado do
 * hardware do aparelho sem exigir uma segunda camada manual de envelope — por isso não há aqui um
 * equivalente explícito à "chave encapsuladora" do [ProvedorChaveMestraAndroid].
 * `LAContext`/gate biométrico continuam fora de #180 (ver #118).
 *
 * ATENÇÃO (registrado no relatório da #180): este arquivo usa cinterop de `platform.Security` sem
 * ter sido compilado localmente — o host desta implementação (Windows) não tem toolchain iOS.
 * Validação real depende do job `ios-compilacao-linux` (klib, tipagem) e principalmente do
 * `ios-xcode-macos` (link) da CI existente da #195.
 */
@OptIn(ExperimentalForeignApi::class)
class ProvedorChaveMestraIOS(
    private val servico: String = "io.savro.app.vault",
    private val conta: String = "savro.vault.master.v1",
) : ProvedorChaveMestra {

    override suspend fun obterOuCriarChave(): Resultado<ByteArray, ErroRepositorio> = try {
        val existente = lerChaveDoKeychain()
        val chave = existente ?: gerarNovaChaveERegistrar()
        Resultado.Sucesso(chave)
    } catch (excecao: Exception) {
        Resultado.Falha(
            ErroRepositorio.ChaveInvalida("Falha ao obter/gerar chave mestra no Keychain (${excecao.message})"),
        )
    }

    override suspend fun invalidarCacheEmMemoria() {
        // Sem cache em memória nesta implementação — cada chamada consulta o Keychain de novo.
        // Hook mantido por simetria com o contrato Android; #118 pode passar a usá-lo.
    }

    private fun consultaBase(): NSMutableDictionary {
        val consulta = NSMutableDictionary()
        consulta.setObject(kSecClassGenericPassword, forKey = kSecClass as NSString)
        consulta.setObject(servico, forKey = kSecAttrService as NSString)
        consulta.setObject(conta, forKey = kSecAttrAccount as NSString)
        return consulta
    }

    private fun lerChaveDoKeychain(): ByteArray? = memScoped {
        val consulta = consultaBase()
        consulta.setObject(true, forKey = kSecReturnData as NSString)
        consulta.setObject(kSecMatchLimitOne, forKey = kSecMatchLimit as NSString)

        val resultadoPonteiro = alloc<CFTypeRefVar>()
        @Suppress("UNCHECKED_CAST")
        val status = SecItemCopyMatching(consulta as CFDictionaryRef, resultadoPonteiro.ptr)
        when (status) {
            errSecSuccess -> {
                @Suppress("UNCHECKED_CAST")
                val dados = resultadoPonteiro.value as? NSData
                dados?.toByteArray()
            }
            errSecItemNotFound -> null
            else -> throw IllegalStateException("SecItemCopyMatching falhou com status $status")
        }
    }

    private fun gerarNovaChaveERegistrar(): ByteArray {
        val novaChave = gerarBytesAleatorios(TAMANHO_CHAVE_BYTES)
        val consulta = consultaBase()
        consulta.setObject(novaChave.toNSData(), forKey = kSecValueData as NSString)
        consulta.setObject(kSecAttrAccessibleWhenUnlockedThisDeviceOnly, forKey = kSecAttrAccessible as NSString)
        consulta.setObject(false, forKey = kSecAttrSynchronizable as NSString)

        @Suppress("UNCHECKED_CAST")
        val status = SecItemAdd(consulta as CFDictionaryRef, null)
        check(status == errSecSuccess) { "SecItemAdd falhou com status $status" }
        return novaChave
    }

    private fun gerarBytesAleatorios(tamanho: Int): ByteArray {
        val buffer = ByteArray(tamanho)
        buffer.usePinned { pinado ->
            val resultado = SecRandomCopyBytes(kSecRandomDefault, tamanho.toULong(), pinado.addressOf(0))
            check(resultado == 0) { "SecRandomCopyBytes falhou com código $resultado" }
        }
        return buffer
    }

    /** Só usada por testes que precisam de um Keychain "limpo" entre execuções. */
    internal fun removerDoKeychainParaTeste() {
        @Suppress("UNCHECKED_CAST")
        SecItemDelete(consultaBase() as CFDictionaryRef)
    }

    private companion object {
        const val TAMANHO_CHAVE_BYTES = 32
    }
}

@OptIn(ExperimentalForeignApi::class)
private fun ByteArray.toNSData(): NSData = if (isEmpty()) {
    NSData()
} else {
    usePinned { pinado -> NSData.create(bytes = pinado.addressOf(0), length = this.size.toULong()) }
}

@OptIn(ExperimentalForeignApi::class)
private fun NSData.toByteArray(): ByteArray {
    val tamanho = this.length.toInt()
    val resultado = ByteArray(tamanho)
    if (tamanho > 0) {
        resultado.usePinned { pinado -> memcpy(pinado.addressOf(0), this.bytes, this.length) }
    }
    return resultado
}
