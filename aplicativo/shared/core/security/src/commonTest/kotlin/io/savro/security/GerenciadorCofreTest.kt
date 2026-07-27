package io.savro.security

import io.savro.domain.patrimonio.ErroRepositorio
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest

/**
 * Cobre a máquina de estados do cofre (#118) com fakes — nenhum dos 8 estados obrigatórios
 * depende de Keystore/Keychain/BiometricPrompt/LAContext reais.
 */
class GerenciadorCofreTest {

    private fun cenario(
        provedor: FakeProvedorChaveMestra = FakeProvedorChaveMestra(),
        repositorio: FakeRepositorioItensPatrimoniais = FakeRepositorioItensPatrimoniais(),
        autenticador: FakeAutenticadorBiometrico = FakeAutenticadorBiometrico(),
        preferencias: FakePreferenciasCofre = FakePreferenciasCofre(),
        relogio: RelogioDeTeste = RelogioDeTeste(),
    ) = Cenario(provedor, repositorio, autenticador, preferencias, relogio)

    private class Cenario(
        val provedor: FakeProvedorChaveMestra,
        val repositorio: FakeRepositorioItensPatrimoniais,
        val autenticador: FakeAutenticadorBiometrico,
        val preferencias: FakePreferenciasCofre,
        val relogio: RelogioDeTeste,
    )

    @Test
    fun semProtecao_abreDireto() = runTest {
        val c = cenario()
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value)
        assertEquals(1, c.repositorio.vezesAberto)
        assertEquals(0, c.autenticador.vezesChamado)
    }

    @Test
    fun comProtecao_autenticacaoComSucesso_desbloqueia() = runTest {
        val c = cenario(
            autenticador = FakeAutenticadorBiometrico(resultadoSimulado = ResultadoAutenticacao.Sucesso),
            preferencias = FakePreferenciasCofre(politica = PoliticaProtecao.Ativada()),
        )
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value)
        assertEquals(1, c.autenticador.vezesChamado)
    }

    @Test
    fun autenticacaoCancelada_viraCredencialInvalida() = runTest {
        val c = cenario(
            autenticador = FakeAutenticadorBiometrico(resultadoSimulado = ResultadoAutenticacao.Cancelado),
            preferencias = FakePreferenciasCofre(politica = PoliticaProtecao.Ativada()),
        )
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertIs<EstadoCofre.CredencialInvalida>(gerenciador.estado.value)
    }

    @Test
    fun autenticacaoComFalhaCredencial_viraCredencialInvalida() = runTest {
        val c = cenario(
            autenticador = FakeAutenticadorBiometrico(
                resultadoSimulado = ResultadoAutenticacao.FalhaCredencial("credencial incorreta"),
            ),
            preferencias = FakePreferenciasCofre(politica = PoliticaProtecao.Ativada()),
        )
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertEquals(EstadoCofre.CredencialInvalida("credencial incorreta"), gerenciador.estado.value)
    }

    @Test
    fun bloqueioTemporarioDoSistema_bloqueiaNovaTentativaAteHorario() = runTest {
        val c = cenario(
            autenticador = FakeAutenticadorBiometrico(
                resultadoSimulado = ResultadoAutenticacao.BloqueioTemporario(tentarNovamenteEmEpocaMs = 30_000L),
            ),
            preferencias = FakePreferenciasCofre(politica = PoliticaProtecao.Ativada()),
        )
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()
        assertEquals(EstadoCofre.BloqueioTemporario(30_000L), gerenciador.estado.value)

        // Tentar de novo antes do horário liberado não deve mostrar o prompt outra vez.
        c.relogio.definir(10_000L)
        gerenciador.tentarNovamente()
        advanceUntilIdle()
        assertEquals(1, c.autenticador.vezesChamado)
        assertEquals(EstadoCofre.BloqueioTemporario(30_000L), gerenciador.estado.value)

        // Depois do horário, tenta de novo de verdade.
        c.relogio.definir(30_001L)
        c.autenticador.resultadoSimulado = ResultadoAutenticacao.Sucesso
        gerenciador.tentarNovamente()
        advanceUntilIdle()
        assertEquals(2, c.autenticador.vezesChamado)
        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value)
    }

    @Test
    fun semBiometriaConfigurada_viraBiometriaIndisponivel() = runTest {
        val c = cenario(
            autenticador = FakeAutenticadorBiometrico(disponibilidadeSimulada = DisponibilidadeBiometria.NaoConfigurada),
            preferencias = FakePreferenciasCofre(politica = PoliticaProtecao.Ativada()),
        )
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertEquals(EstadoCofre.BiometriaIndisponivel, gerenciador.estado.value)
        assertEquals(0, c.autenticador.vezesChamado)
    }

    @Test
    fun chaveInvalidada_persisteEExigeReconhecimentoAntesDeRestauracao() = runTest {
        val c = cenario(provedor = FakeProvedorChaveMestra(chaveValidaSimulada = false))
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertIs<EstadoCofre.ChaveInvalidada>(gerenciador.estado.value)
        assertTrue(c.preferencias.chaveInvalidadaPersistida())
        // Nunca apaga nem recria: o repositório físico não foi tocado além da tentativa de abrir.
        assertEquals(0, c.repositorio.vezesAberto)

        gerenciador.reconhecerChaveInvalidada()
        assertEquals(EstadoCofre.RestauracaoNecessaria, gerenciador.estado.value)
    }

    @Test
    fun chaveJaInvalidadaAnteriormente_vaiDiretoParaRestauracaoSemNovaTentativa() = runTest {
        val c = cenario(preferencias = FakePreferenciasCofre(chaveInvalidada = true))
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertEquals(EstadoCofre.RestauracaoNecessaria, gerenciador.estado.value)
        assertEquals(0, c.repositorio.vezesAberto)
        assertEquals(0, c.autenticador.vezesChamado)
    }

    @Test
    fun falhaDeAberturaNaoRelacionadaAChave_viraErroRecuperavel() = runTest {
        val c = cenario(
            repositorio = FakeRepositorioItensPatrimoniais(
                erroAoAbrir = ErroRepositorio.FalhaAbertura("disco cheio"),
            ),
        )
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()

        assertEquals(EstadoCofre.ErroRecuperavel("disco cheio"), gerenciador.estado.value)
    }

    @Test
    fun ativarAlterarERemoverProtecao_persistemNaPreferencia() = runTest {
        val c = cenario()
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.ativarProtecao(permitirCredencialDispositivo = true)
        assertEquals(PoliticaProtecao.Ativada(true), gerenciador.politicaAtual())

        gerenciador.alterarProtecao(permitirCredencialDispositivo = false)
        assertEquals(PoliticaProtecao.Ativada(false), gerenciador.politicaAtual())

        gerenciador.removerProtecao()
        assertEquals(PoliticaProtecao.Nenhuma, gerenciador.politicaAtual())
    }

    @Test
    fun segundoPlanoInvalidaCacheDeChave() = runTest {
        val c = cenario()
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.notificarAppEmSegundoPlano()
        advanceUntilIdle()

        assertEquals(1, c.provedor.vezesInvalidada)
    }

    @Test
    fun voltarAntesDoTimeout_naoRebloqueiaOCofre() = runTest {
        val c = cenario()
        c.preferencias.definirTimeoutInatividadeMs(60_000L)
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()
        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value)

        c.relogio.definir(1_000L)
        gerenciador.notificarAppEmSegundoPlano()
        advanceUntilIdle()

        c.relogio.definir(30_000L) // 29s decorridos, abaixo do timeout de 60s
        gerenciador.notificarAppEmPrimeiroPlano()
        advanceUntilIdle()

        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value)
        assertEquals(0, c.repositorio.vezesFechado)
    }

    @Test
    fun voltarDepoisDoTimeout_rebloqueiaEReabreOCofre() = runTest {
        val c = cenario()
        c.preferencias.definirTimeoutInatividadeMs(60_000L)
        val gerenciador = GerenciadorCofre(c.provedor, c.repositorio, c.autenticador, c.preferencias, c.relogio, this)

        gerenciador.iniciar()
        advanceUntilIdle()
        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value)

        c.relogio.definir(1_000L)
        gerenciador.notificarAppEmSegundoPlano()
        advanceUntilIdle()

        c.relogio.definir(120_000L) // 119s decorridos, acima do timeout de 60s
        gerenciador.notificarAppEmPrimeiroPlano()
        advanceUntilIdle()

        assertEquals(1, c.repositorio.vezesFechado)
        assertEquals(EstadoCofre.Desbloqueado, gerenciador.estado.value) // política Nenhuma reabre sem prompt
        assertEquals(2, c.repositorio.vezesAberto)
    }
}
