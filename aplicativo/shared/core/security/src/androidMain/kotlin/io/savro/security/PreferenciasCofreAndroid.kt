package io.savro.security

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * [PreferenciasCofre] Android: `SharedPreferences` simples — nenhum valor guardado aqui é
 * material criptográfico (esse é o Keystore, via `ProvedorChaveMestraAndroid`, #180), então não
 * precisa de `EncryptedSharedPreferences`.
 */
class PreferenciasCofreAndroid(context: Context) : PreferenciasCofre {

    private val preferencias = context.applicationContext
        .getSharedPreferences(NOME_ARQUIVO, Context.MODE_PRIVATE)

    override suspend fun onboardingConcluido(): Boolean = withContext(Dispatchers.IO) {
        preferencias.getBoolean(CHAVE_ONBOARDING_CONCLUIDO, false)
    }

    override suspend fun marcarOnboardingConcluido(): Unit = withContext(Dispatchers.IO) {
        preferencias.edit().putBoolean(CHAVE_ONBOARDING_CONCLUIDO, true).apply()
    }

    override suspend fun politicaProtecao(): PoliticaProtecao = withContext(Dispatchers.IO) {
        if (preferencias.getBoolean(CHAVE_PROTECAO_ATIVA, false)) {
            PoliticaProtecao.Ativada(preferencias.getBoolean(CHAVE_PERMITIR_CREDENCIAL, true))
        } else {
            PoliticaProtecao.Nenhuma
        }
    }

    override suspend fun definirPoliticaProtecao(politica: PoliticaProtecao): Unit = withContext(Dispatchers.IO) {
        preferencias.edit().apply {
            when (politica) {
                PoliticaProtecao.Nenhuma -> putBoolean(CHAVE_PROTECAO_ATIVA, false)
                is PoliticaProtecao.Ativada -> {
                    putBoolean(CHAVE_PROTECAO_ATIVA, true)
                    putBoolean(CHAVE_PERMITIR_CREDENCIAL, politica.permitirCredencialDispositivo)
                }
            }
        }.apply()
    }

    override suspend fun timeoutInatividadeMs(): Long = withContext(Dispatchers.IO) {
        preferencias.getLong(CHAVE_TIMEOUT, PreferenciasCofrePadrao.TIMEOUT_INATIVIDADE_MS_PADRAO)
    }

    override suspend fun definirTimeoutInatividadeMs(valor: Long): Unit = withContext(Dispatchers.IO) {
        preferencias.edit().putLong(CHAVE_TIMEOUT, valor).apply()
    }

    override suspend fun chaveInvalidadaPersistida(): Boolean = withContext(Dispatchers.IO) {
        preferencias.getBoolean(CHAVE_INVALIDADA, false)
    }

    override suspend fun marcarChaveInvalidadaPersistida(): Unit = withContext(Dispatchers.IO) {
        preferencias.edit().putBoolean(CHAVE_INVALIDADA, true).apply()
    }

    private companion object {
        const val NOME_ARQUIVO = "savro_cofre_preferencias"
        const val CHAVE_ONBOARDING_CONCLUIDO = "onboarding_concluido"
        const val CHAVE_PROTECAO_ATIVA = "protecao_ativa"
        const val CHAVE_PERMITIR_CREDENCIAL = "permitir_credencial_dispositivo"
        const val CHAVE_TIMEOUT = "timeout_inatividade_ms"
        const val CHAVE_INVALIDADA = "chave_invalidada_persistida"
    }
}
