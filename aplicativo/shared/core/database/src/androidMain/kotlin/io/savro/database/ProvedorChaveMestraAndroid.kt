package io.savro.database

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import java.io.File
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * [ProvedorChaveMestra] Android: passphrase aleatória de 256 bits, gerada uma vez, encapsulada
 * (AES-256-GCM) por uma chave não exportável do Android Keystore (alias
 * `savro.vault.master.v1`, ADR-002/117-A). SQLCipher não gerencia chave — isso é papel deste
 * provedor.
 *
 * O blob encapsulado é gravado em [Context.getNoBackupFilesDir] — diretório do próprio Android
 * pensado exatamente para segredos que nunca podem ir a um backup automático, redundante com
 * `android:allowBackup="false"` já definido em `AndroidManifest.xml`. Nunca fica ao lado de
 * `savro.db` nem em `SharedPreferences`/DataStore comuns (117-A, seção "O que fica protegido"),
 * e nunca é a passphrase em texto claro — só o resultado já cifrado pelo Keystore.
 */
class ProvedorChaveMestraAndroid(
    private val context: Context,
) : ProvedorChaveMestra {

    private val keyStore: KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply { load(null) }

    private val arquivoChaveEncapsulada: File
        get() = File(context.noBackupFilesDir, NOME_ARQUIVO_CHAVE_ENCAPSULADA)

    override suspend fun obterOuCriarChave(): Resultado<ByteArray, ErroRepositorio> =
        withContext(Dispatchers.IO) {
            try {
                val chaveEncapsuladora = obterOuCriarChaveEncapsuladora()
                val arquivo = arquivoChaveEncapsulada

                val passphrase = if (arquivo.exists()) {
                    desencapsular(chaveEncapsuladora, arquivo.readBytes())
                } else {
                    val nova = ByteArray(TAMANHO_PASSPHRASE_BYTES).also { SecureRandom().nextBytes(it) }
                    arquivo.writeBytes(encapsular(chaveEncapsuladora, nova))
                    nova
                }
                Resultado.Sucesso(passphrase)
            } catch (excecao: KeyPermanentlyInvalidatedException) {
                // Biometria/credencial do aparelho mudou (ou o Keystore foi limpo) — o arquivo
                // encapsulado permanece no disco intacto; não apagamos nem recriamos nada aqui.
                // Sem uma chave de Keystore válida, essa passphrase antiga nunca mais decifra —
                // a recuperação passa a ser responsabilidade de #118 (restauração via
                // `*.savrobackup`), nunca automática.
                Resultado.Falha(
                    ErroRepositorio.ChaveInvalida(
                        "Chave do Keystore invalidada permanentemente (${excecao.javaClass.simpleName})",
                    ),
                )
            } catch (excecao: Exception) {
                Resultado.Falha(
                    ErroRepositorio.ChaveInvalida(
                        "Falha ao obter/gerar chave mestra (${excecao.javaClass.simpleName})",
                    ),
                )
            }
        }

    override suspend fun invalidarCacheEmMemoria() {
        // Sem cache em memória nesta implementação — cada chamada lê Keystore/arquivo de novo.
        // Hook mantido por simetria com o contrato; #118 pode passar a usá-lo quando adicionar
        // cache real vinculado ao ciclo de vida do app (background, bloqueio).
    }

    private fun obterOuCriarChaveEncapsuladora(): SecretKey {
        (keyStore.getKey(ALIAS_CHAVE_MESTRA, null) as? SecretKey)?.let { return it }

        val gerador = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_PROVIDER)
        val especificacao = KeyGenParameterSpec.Builder(
            ALIAS_CHAVE_MESTRA,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            // setUserAuthenticationRequired fica fora de #180 de propósito: o gate biométrico/PIN
            // é a máquina de estados de desbloqueio da #118, construída por cima deste provedor.
            // #180 garante só que a chave nunca sai do Keystore em texto claro e nunca é
            // exportável — não decide ainda que toda leitura exige biometria.
            .build()
        gerador.init(especificacao)
        return gerador.generateKey()
    }

    private fun encapsular(chaveEncapsuladora: SecretKey, dados: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(TRANSFORMACAO)
        cipher.init(Cipher.ENCRYPT_MODE, chaveEncapsuladora)
        val textoCifrado = cipher.doFinal(dados)
        return cipher.iv + textoCifrado
    }

    private fun desencapsular(chaveEncapsuladora: SecretKey, dadosEncapsulados: ByteArray): ByteArray {
        val iv = dadosEncapsulados.copyOfRange(0, TAMANHO_IV_BYTES)
        val textoCifrado = dadosEncapsulados.copyOfRange(TAMANHO_IV_BYTES, dadosEncapsulados.size)
        val cipher = Cipher.getInstance(TRANSFORMACAO)
        cipher.init(Cipher.DECRYPT_MODE, chaveEncapsuladora, GCMParameterSpec(TAMANHO_TAG_GCM_BITS, iv))
        return cipher.doFinal(textoCifrado)
    }

    private companion object {
        const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        const val ALIAS_CHAVE_MESTRA = "savro.vault.master.v1"
        const val NOME_ARQUIVO_CHAVE_ENCAPSULADA = "savro_vault_master_key.bin"
        const val TRANSFORMACAO = "AES/GCM/NoPadding"
        const val TAMANHO_TAG_GCM_BITS = 128
        const val TAMANHO_IV_BYTES = 12
        const val TAMANHO_PASSPHRASE_BYTES = 32
    }
}
