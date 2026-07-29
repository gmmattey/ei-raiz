package io.savro.security

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * [AutenticadorBiometrico] Android: `BiometricPrompt` + credencial segura do dispositivo (#118).
 *
 * `BiometricPrompt` precisa de uma `FragmentActivity`/`Fragment` viva no momento de mostrar o
 * prompt — como a Activity pode ser recriada (rotação, processo restaurado), a referência é
 * atualizada pelo host a cada `onResume`/`onPause` via [vincularAtividade]/[desvincularAtividade],
 * nunca guardada permanentemente.
 */
class AutenticadorBiometricoAndroid(
    private val context: Context,
) : AutenticadorBiometrico {

    @Volatile
    private var atividadeAtual: FragmentActivity? = null

    fun vincularAtividade(atividade: FragmentActivity) {
        atividadeAtual = atividade
    }

    fun desvincularAtividade(atividade: FragmentActivity) {
        if (atividadeAtual === atividade) atividadeAtual = null
    }

    override suspend fun disponibilidade(permitirCredencialDispositivo: Boolean): DisponibilidadeBiometria {
        val gerenciador = BiometricManager.from(context)
        val autenticadores = if (permitirCredencialDispositivo) {
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        } else {
            BiometricManager.Authenticators.BIOMETRIC_STRONG
        }
        val status = gerenciador.canAuthenticate(autenticadores)

        // BIOMETRIC_ERROR_NO_HARDWARE/HW_UNAVAILABLE, na combinação com DEVICE_CREDENTIAL, também é
        // o que o BiometricManager devolve quando o problema real não é o sensor, e sim o aparelho
        // não ter nenhum código/PIN/padrão configurado — checa a credencial isolada pra diferenciar
        // as duas mensagens (nunca sugerir "cadastre biometria" quando o problema é outro, #226).
        val statusApenasCredencial = if (permitirCredencialDispositivo) {
            gerenciador.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL)
        } else {
            null
        }

        return mapearDisponibilidade(status, permitirCredencialDispositivo, statusApenasCredencial)
    }

    override suspend fun autenticar(
        motivo: String,
        permitirCredencialDispositivo: Boolean,
    ): ResultadoAutenticacao {
        val atividade = atividadeAtual
            ?: return ResultadoAutenticacao.Indisponivel("Nenhuma tela em primeiro plano para exibir o prompt")

        return suspendCancellableCoroutine { continuacao ->
            val executor = ContextCompat.getMainExecutor(context)
            val callback = object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    if (continuacao.isActive) continuacao.resume(ResultadoAutenticacao.Sucesso)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    if (!continuacao.isActive) return
                    continuacao.resume(mapearErro(errorCode, errString.toString()))
                }

                // Uma rejeição isolada (ex.: dedo errado) não encerra o prompt — o usuário pode
                // tentar de novo sem uma nova chamada a autenticar(); só resolvemos a coroutine no
                // desfecho final (sucesso ou erro terminal acima).
                override fun onAuthenticationFailed() = Unit
            }

            val prompt = BiometricPrompt(atividade, executor, callback)
            val autenticadoresPermitidos = if (permitirCredencialDispositivo) {
                BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
            } else {
                BiometricManager.Authenticators.BIOMETRIC_STRONG
            }
            val construtor = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Desbloquear o Savro")
                .setSubtitle(motivo)
                .setAllowedAuthenticators(autenticadoresPermitidos)
            // setNegativeButtonText é incompatível com DEVICE_CREDENTIAL no conjunto de
            // autenticadores permitidos (a própria API lança IllegalArgumentException).
            if (!permitirCredencialDispositivo) {
                construtor.setNegativeButtonText("Cancelar")
            }

            continuacao.invokeOnCancellation { prompt.cancelAuthentication() }
            prompt.authenticate(construtor.build())
        }
    }

    internal fun mapearErro(codigo: Int, mensagem: String): ResultadoAutenticacao = when (codigo) {
        BiometricPrompt.ERROR_USER_CANCELED,
        BiometricPrompt.ERROR_NEGATIVE_BUTTON,
        BiometricPrompt.ERROR_CANCELED,
        -> ResultadoAutenticacao.Cancelado
        BiometricPrompt.ERROR_LOCKOUT ->
            ResultadoAutenticacao.BloqueioTemporario(System.currentTimeMillis() + BLOQUEIO_TEMPORARIO_PADRAO_MS)
        BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> ResultadoAutenticacao.BloqueioPermanente
        BiometricPrompt.ERROR_NO_BIOMETRICS,
        BiometricPrompt.ERROR_HW_UNAVAILABLE,
        BiometricPrompt.ERROR_HW_NOT_PRESENT,
        BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL,
        -> ResultadoAutenticacao.Indisponivel(mensagem)
        else -> ResultadoAutenticacao.FalhaCredencial(mensagem)
    }

    private companion object {
        const val BLOQUEIO_TEMPORARIO_PADRAO_MS = 30_000L
    }
}

/**
 * Mapeamento puro dos códigos de `BiometricManager.canAuthenticate` (#226) — função de nível de
 * topo (não depende de `Context`/instância) para ser testável direto, sem precisar simular
 * hardware real via Robolectric (ver `AutenticadorBiometricoAndroidTest`).
 *
 * @param status resultado de `canAuthenticate` com a combinação de autenticadores efetivamente
 *   pedida (biometria isolada, ou biometria + credencial).
 * @param permitirCredencialDispositivo mesma combinação usada para obter [status].
 * @param statusApenasCredencial resultado de `canAuthenticate(DEVICE_CREDENTIAL)` isolado, só
 *   quando [permitirCredencialDispositivo] é `true` — usado para diferenciar "sem hardware
 *   biométrico" de "sem credencial do aparelho nenhuma" (o Android devolve o mesmo código de erro
 *   para os dois casos na combinação combinada).
 */
internal fun mapearDisponibilidade(
    status: Int,
    permitirCredencialDispositivo: Boolean,
    statusApenasCredencial: Int?,
): DisponibilidadeBiometria = when (status) {
    BiometricManager.BIOMETRIC_SUCCESS -> DisponibilidadeBiometria.Disponivel

    BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
    BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE,
    -> when {
        !permitirCredencialDispositivo -> DisponibilidadeBiometria.SemHardware
        statusApenasCredencial == BiometricManager.BIOMETRIC_SUCCESS -> DisponibilidadeBiometria.SemHardware
        else -> DisponibilidadeBiometria.SemCredencialDispositivo
    }

    BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> DisponibilidadeBiometria.NaoConfigurada

    // Atualização de segurança pendente é transitório e fora do controle do usuário dentro do
    // app — mais próximo de "indisponível agora" do que de qualquer estado de configuração.
    BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> DisponibilidadeBiometria.Indisponivel

    BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED,
    BiometricManager.BIOMETRIC_STATUS_UNKNOWN,
    -> DisponibilidadeBiometria.ErroDesconhecido("BiometricManager retornou status $status")

    else -> DisponibilidadeBiometria.ErroDesconhecido("Código de status desconhecido: $status")
}
