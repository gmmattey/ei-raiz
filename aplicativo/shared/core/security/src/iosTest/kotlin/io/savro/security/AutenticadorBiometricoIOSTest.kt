package io.savro.security

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import platform.Foundation.NSError
import platform.LocalAuthentication.LAErrorAppCancel
import platform.LocalAuthentication.LAErrorAuthenticationFailed
import platform.LocalAuthentication.LAErrorBiometryLockout
import platform.LocalAuthentication.LAErrorBiometryNotAvailable
import platform.LocalAuthentication.LAErrorBiometryNotEnrolled
import platform.LocalAuthentication.LAErrorDomain
import platform.LocalAuthentication.LAErrorPasscodeNotSet
import platform.LocalAuthentication.LAErrorSystemCancel
import platform.LocalAuthentication.LAErrorUserCancel
import platform.LocalAuthentication.LAErrorUserFallback

/**
 * Mapeamento de `LAError`/políticas (#226) — usa instâncias reais de `NSError` com cada código de
 * `LAError`, nunca um sensor físico nem um `LAContext` real (só o mapeamento puro é exercitado
 * aqui; `AutenticadorBiometricoIOS.disponibilidade`/`autenticar`, que chamam a API real do
 * sistema, dependem do job `ios-xcode-macos` da CI pra validação de integração — ver docstring da
 * classe). Roda em `iosArm64Test`/`iosSimulatorArm64Test`, sem exigir device físico.
 */
class AutenticadorBiometricoIOSTest {

    private val autenticador = AutenticadorBiometricoIOS()

    private fun erro(codigo: Long) = NSError(domain = LAErrorDomain, code = codigo, userInfo = null)

    // --- mapearDisponibilidade ---

    @Test
    fun mapearDisponibilidade_passcodeNaoDefinido_viraSemCredencialDispositivo() {
        assertEquals(DisponibilidadeBiometria.SemCredencialDispositivo, mapearDisponibilidade(erro(LAErrorPasscodeNotSet)))
    }

    @Test
    fun mapearDisponibilidade_biometriaIndisponivel_viraSemHardware() {
        assertEquals(DisponibilidadeBiometria.SemHardware, mapearDisponibilidade(erro(LAErrorBiometryNotAvailable)))
    }

    @Test
    fun mapearDisponibilidade_biometriaNaoCadastrada_viraNaoConfigurada() {
        assertEquals(DisponibilidadeBiometria.NaoConfigurada, mapearDisponibilidade(erro(LAErrorBiometryNotEnrolled)))
    }

    @Test
    fun mapearDisponibilidade_biometriaBloqueada_viraBloqueadaPermanentemente() {
        // No iOS, LAErrorBiometryLockout exige confirmar a credencial do aparelho pra resetar —
        // nunca temporizado, por isso não mapeia para BloqueadaTemporariamente (ver comentário na
        // implementação).
        assertEquals(DisponibilidadeBiometria.BloqueadaPermanentemente, mapearDisponibilidade(erro(LAErrorBiometryLockout)))
    }

    @Test
    fun mapearDisponibilidade_codigoNaoMapeado_viraErroDesconhecido() {
        assertIs<DisponibilidadeBiometria.ErroDesconhecido>(mapearDisponibilidade(erro(LAErrorAuthenticationFailed)))
    }

    @Test
    fun mapearDisponibilidade_semErro_viraErroDesconhecidoSemFingirDisponivel() {
        // `disponibilidade()` só chama este mapeamento quando `canEvaluatePolicy` já retornou
        // `false` — um `erro` nulo aqui não deveria acontecer na prática, mas o mapeamento nunca
        // finge sucesso mesmo nesse caso extremo.
        assertIs<DisponibilidadeBiometria.ErroDesconhecido>(mapearDisponibilidade(null))
    }

    // --- mapearErro (autenticar) ---

    @Test
    fun mapearErro_cancelamentoDoUsuario_naoViraFalhaDestrutiva() {
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(erro(LAErrorUserCancel)))
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(erro(LAErrorSystemCancel)))
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(erro(LAErrorAppCancel)))
        assertEquals(ResultadoAutenticacao.Cancelado, autenticador.mapearErro(erro(LAErrorUserFallback)))
    }

    @Test
    fun mapearErro_biometriaBloqueada_viraBloqueioPermanente() {
        assertEquals(ResultadoAutenticacao.BloqueioPermanente, autenticador.mapearErro(erro(LAErrorBiometryLockout)))
    }

    @Test
    fun mapearErro_semBiometriaOuPasscode_viraIndisponivel() {
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(erro(LAErrorBiometryNotAvailable)))
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(erro(LAErrorBiometryNotEnrolled)))
        assertIs<ResultadoAutenticacao.Indisponivel>(autenticador.mapearErro(erro(LAErrorPasscodeNotSet)))
    }

    @Test
    fun mapearErro_falhaDeCredencial_viraFalhaCredencial() {
        assertIs<ResultadoAutenticacao.FalhaCredencial>(autenticador.mapearErro(erro(LAErrorAuthenticationFailed)))
    }

    @Test
    fun mapearErro_semErro_naoLancaExcecao() {
        assertIs<ResultadoAutenticacao.FalhaCredencial>(autenticador.mapearErro(null))
    }
}
