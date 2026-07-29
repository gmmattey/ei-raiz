package io.savro.security

import kotlin.coroutines.resume
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.ObjCObjectVar
import kotlinx.cinterop.alloc
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.value
import kotlinx.coroutines.suspendCancellableCoroutine
import platform.Foundation.NSError
import platform.LocalAuthentication.LAContext
import platform.LocalAuthentication.LAErrorAppCancel
import platform.LocalAuthentication.LAErrorBiometryLockout
import platform.LocalAuthentication.LAErrorBiometryNotAvailable
import platform.LocalAuthentication.LAErrorBiometryNotEnrolled
import platform.LocalAuthentication.LAErrorPasscodeNotSet
import platform.LocalAuthentication.LAErrorSystemCancel
import platform.LocalAuthentication.LAErrorUserCancel
import platform.LocalAuthentication.LAErrorUserFallback
import platform.LocalAuthentication.LAPolicyDeviceOwnerAuthentication
import platform.LocalAuthentication.LAPolicyDeviceOwnerAuthenticationWithBiometrics

/**
 * [AutenticadorBiometrico] iOS: `LocalAuthentication`/`LAContext` (Face ID, Touch ID ou código do
 * dispositivo) — #118.
 *
 * ATENÇÃO (mesmo risco documentado em `ProvedorChaveMestraIOS`, #180): escrito em host Windows sem
 * toolchain iOS; validação real depende do job `ios-xcode-macos` da CI (runner macOS).
 */
@OptIn(ExperimentalForeignApi::class)
class AutenticadorBiometricoIOS : AutenticadorBiometrico {

    @OptIn(BetaInteropApi::class)
    override suspend fun disponibilidade(permitirCredencialDispositivo: Boolean): DisponibilidadeBiometria =
        memScoped {
            // Instância nova a cada checagem (padrão recomendado pela Apple, mesma regra de
            // `autenticar`) — `canEvaluatePolicy` nunca dispara prompt, só consulta o sistema.
            val contexto = LAContext()
            val erro = alloc<ObjCObjectVar<NSError?>>()
            val politica = if (permitirCredencialDispositivo) {
                LAPolicyDeviceOwnerAuthentication
            } else {
                LAPolicyDeviceOwnerAuthenticationWithBiometrics
            }
            val podeAvaliar = contexto.canEvaluatePolicy(politica, error = erro.ptr)
            if (podeAvaliar) return@memScoped DisponibilidadeBiometria.Disponivel

            mapearDisponibilidade(erro.value)
        }

    override suspend fun autenticar(
        motivo: String,
        permitirCredencialDispositivo: Boolean,
    ): ResultadoAutenticacao = suspendCancellableCoroutine { continuacao ->
        val contexto = LAContext()
        val politica = if (permitirCredencialDispositivo) {
            LAPolicyDeviceOwnerAuthentication
        } else {
            LAPolicyDeviceOwnerAuthenticationWithBiometrics
        }

        contexto.evaluatePolicy(politica, localizedReason = motivo) { sucesso, erro ->
            if (!continuacao.isActive) return@evaluatePolicy
            if (sucesso) {
                continuacao.resume(ResultadoAutenticacao.Sucesso)
            } else {
                continuacao.resume(mapearErro(erro))
            }
        }
    }

    internal fun mapearErro(erro: NSError?): ResultadoAutenticacao = when (erro?.code) {
        LAErrorUserCancel, LAErrorSystemCancel, LAErrorAppCancel, LAErrorUserFallback ->
            ResultadoAutenticacao.Cancelado
        // O iOS não tem um "ERROR_LOCKOUT" temporizado equivalente ao do Android — o único código
        // de bloqueio biométrico (LAErrorBiometryLockout) exige o usuário confirmar a credencial
        // do aparelho pra resetar, o que é semanticamente um bloqueio permanente, não temporário
        // (achado da auditoria #226 — a versão anterior mapeava isso como 30s fixos, incorreto).
        LAErrorBiometryLockout -> ResultadoAutenticacao.BloqueioPermanente
        LAErrorBiometryNotAvailable, LAErrorBiometryNotEnrolled, LAErrorPasscodeNotSet ->
            ResultadoAutenticacao.Indisponivel(erro?.localizedDescription ?: "Biometria indisponível")
        else -> ResultadoAutenticacao.FalhaCredencial(erro?.localizedDescription ?: "Falha de autenticação")
    }
}

/**
 * Mapeamento puro de [NSError.code] de `LAContext.canEvaluatePolicy` (#226) — função de nível de
 * topo, testável direto com instâncias de `NSError` reais em `iosTest`
 * (`AutenticadorBiometricoIOSTest`), sem precisar de sensor físico nem mock de `LAContext`.
 */
internal fun mapearDisponibilidade(erro: NSError?): DisponibilidadeBiometria = when (erro?.code) {
    // No iOS, sem passcode configurado nem biometria funciona (Face ID/Touch ID exigem passcode
    // definido) — LAErrorPasscodeNotSet é sempre a causa raiz "sem credencial do aparelho", não
    // "sem hardware biométrico", mesmo quando a checagem pedida foi só biometria (#226: nunca
    // sugerir "cadastre sua biometria" quando o problema real é a ausência de passcode).
    LAErrorPasscodeNotSet -> DisponibilidadeBiometria.SemCredencialDispositivo
    LAErrorBiometryNotAvailable -> DisponibilidadeBiometria.SemHardware
    LAErrorBiometryNotEnrolled -> DisponibilidadeBiometria.NaoConfigurada
    // Ver comentário em `mapearErro`: no iOS o único código de lockout biométrico se comporta como
    // bloqueio permanente (exige credencial do aparelho pra resetar), nunca temporizado.
    LAErrorBiometryLockout -> DisponibilidadeBiometria.BloqueadaPermanentemente
    else -> DisponibilidadeBiometria.ErroDesconhecido(
        erro?.localizedDescription ?: "Código de status desconhecido: ${erro?.code}",
    )
}
