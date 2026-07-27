package io.savro.security

import kotlin.coroutines.resume
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
import platform.posix.time

/**
 * [AutenticadorBiometrico] iOS: `LocalAuthentication`/`LAContext` (Face ID, Touch ID ou código do
 * dispositivo) — #118.
 *
 * ATENÇÃO (mesmo risco documentado em `ProvedorChaveMestraIOS`, #180): escrito em host Windows sem
 * toolchain iOS; validação real depende do job `ios-xcode-macos` da CI (runner macOS).
 */
@OptIn(ExperimentalForeignApi::class)
class AutenticadorBiometricoIOS : AutenticadorBiometrico {

    override suspend fun disponibilidade(): DisponibilidadeBiometria = memScoped {
        val contexto = LAContext()
        val erro = alloc<ObjCObjectVar<NSError?>>()
        val podeAvaliar = contexto.canEvaluatePolicy(
            LAPolicyDeviceOwnerAuthentication,
            error = erro.ptr,
        )
        if (podeAvaliar) return@memScoped DisponibilidadeBiometria.Disponivel

        when (erro.value?.code) {
            LAErrorBiometryNotAvailable, LAErrorPasscodeNotSet -> DisponibilidadeBiometria.SemHardware
            LAErrorBiometryNotEnrolled -> DisponibilidadeBiometria.NaoConfigurada
            LAErrorBiometryLockout ->
                DisponibilidadeBiometria.TemporariamenteIndisponivel("Biometria temporariamente bloqueada pelo sistema")
            else -> DisponibilidadeBiometria.TemporariamenteIndisponivel(
                erro.value?.localizedDescription ?: "Status de biometria desconhecido",
            )
        }
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

    private fun mapearErro(erro: NSError?): ResultadoAutenticacao = when (erro?.code) {
        LAErrorUserCancel, LAErrorSystemCancel, LAErrorAppCancel, LAErrorUserFallback ->
            ResultadoAutenticacao.Cancelado
        LAErrorBiometryLockout -> ResultadoAutenticacao.BloqueioTemporario(
            time(null) * 1000L + BLOQUEIO_TEMPORARIO_PADRAO_MS,
        )
        LAErrorBiometryNotAvailable, LAErrorBiometryNotEnrolled, LAErrorPasscodeNotSet ->
            ResultadoAutenticacao.Indisponivel(erro?.localizedDescription ?: "Biometria indisponível")
        else -> ResultadoAutenticacao.FalhaCredencial(erro?.localizedDescription ?: "Falha de autenticação")
    }

    private companion object {
        const val BLOQUEIO_TEMPORARIO_PADRAO_MS = 30_000L
    }
}
