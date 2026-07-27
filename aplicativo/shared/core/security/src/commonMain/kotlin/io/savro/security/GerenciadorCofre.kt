package io.savro.security

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Orquestra a máquina de estados do cofre local (#118) por cima dos contratos já aprovados na
 * #180 (`ProvedorChaveMestra`, `RepositorioItensPatrimoniais`). Não conhece Keystore, Keychain,
 * BiometricPrompt nem LAContext — só os contratos comuns, por isso é 100% testável em
 * `commonTest` com fakes (ver `GerenciadorCofreTest`).
 *
 * Nunca apaga nem recria o banco por falha de chave — [tratarErroChave] só transiciona estado.
 */
class GerenciadorCofre(
    private val provedorChaveMestra: ProvedorChaveMestra,
    private val repositorio: RepositorioItensPatrimoniais,
    private val autenticador: AutenticadorBiometrico,
    private val preferencias: PreferenciasCofre,
    private val relogio: Relogio,
    private val escopo: CoroutineScope,
) {
    private val _estado = MutableStateFlow<EstadoCofre>(EstadoCofre.Descriptografando)
    val estado: StateFlow<EstadoCofre> = _estado.asStateFlow()

    private val mutex = Mutex()
    private var momentoEntrouEmSegundoPlanoMs: Long? = null

    suspend fun onboardingConcluido(): Boolean = preferencias.onboardingConcluido()

    suspend fun marcarOnboardingConcluido() = preferencias.marcarOnboardingConcluido()

    /** Chamado uma vez pelo host ao criar a tela de desbloqueio. Idempotente. */
    fun iniciar() {
        escopo.launch { avaliarInicio() }
    }

    /** Repete a tentativa — chamado pela UI após `CredencialInvalida`/`ErroRecuperavel`/`BiometriaIndisponivel`. */
    fun tentarNovamente() {
        escopo.launch { avaliarInicio() }
    }

    private suspend fun avaliarInicio() = mutex.withLock {
        if (preferencias.chaveInvalidadaPersistida()) {
            _estado.value = EstadoCofre.RestauracaoNecessaria
            return@withLock
        }
        if (bloqueioTemporarioAindaAtivo()) return@withLock

        _estado.value = EstadoCofre.Descriptografando

        when (preferencias.politicaProtecao()) {
            PoliticaProtecao.Nenhuma -> abrirCofre()
            is PoliticaProtecao.Ativada -> autenticarEAbrir()
        }
    }

    private fun bloqueioTemporarioAindaAtivo(): Boolean {
        val atual = _estado.value
        return atual is EstadoCofre.BloqueioTemporario && relogio.agoraEmEpocaMs() < atual.tentarNovamenteEmEpocaMs
    }

    private suspend fun autenticarEAbrir() {
        val politica = preferencias.politicaProtecao() as? PoliticaProtecao.Ativada ?: return abrirCofre()

        when (val disponibilidade = autenticador.disponibilidade()) {
            DisponibilidadeBiometria.Disponivel -> {
                when (
                    val resultado = autenticador.autenticar(
                        motivo = "Desbloquear o Savro",
                        permitirCredencialDispositivo = politica.permitirCredencialDispositivo,
                    )
                ) {
                    ResultadoAutenticacao.Sucesso -> abrirCofre()
                    ResultadoAutenticacao.Cancelado ->
                        _estado.value = EstadoCofre.CredencialInvalida("Autenticação cancelada")
                    is ResultadoAutenticacao.FalhaCredencial ->
                        _estado.value = EstadoCofre.CredencialInvalida(resultado.motivo)
                    is ResultadoAutenticacao.BloqueioTemporario ->
                        _estado.value = EstadoCofre.BloqueioTemporario(resultado.tentarNovamenteEmEpocaMs)
                    is ResultadoAutenticacao.Indisponivel ->
                        _estado.value = EstadoCofre.BiometriaIndisponivel
                }
            }
            DisponibilidadeBiometria.SemHardware, DisponibilidadeBiometria.NaoConfigurada ->
                _estado.value = EstadoCofre.BiometriaIndisponivel
            is DisponibilidadeBiometria.TemporariamenteIndisponivel ->
                _estado.value = EstadoCofre.ErroRecuperavel(disponibilidade.motivo)
        }
    }

    private suspend fun abrirCofre() {
        when (val resultadoChave = provedorChaveMestra.obterOuCriarChave()) {
            is Resultado.Falha -> tratarErro(resultadoChave.erro)
            is Resultado.Sucesso -> when (val resultadoAbertura = repositorio.abrir()) {
                is Resultado.Sucesso -> _estado.value = EstadoCofre.Desbloqueado
                is Resultado.Falha -> tratarErro(resultadoAbertura.erro)
            }
        }
    }

    private suspend fun tratarErro(erro: ErroRepositorio) {
        _estado.value = when (erro) {
            is ErroRepositorio.ChaveInvalida -> {
                preferencias.marcarChaveInvalidadaPersistida()
                EstadoCofre.ChaveInvalidada(erro.mensagem)
            }
            is ErroRepositorio.FalhaAbertura -> EstadoCofre.ErroRecuperavel(erro.mensagem)
            is ErroRepositorio.FalhaMigracao -> EstadoCofre.ErroRecuperavel(erro.mensagem)
            is ErroRepositorio.FalhaTransacao -> EstadoCofre.ErroRecuperavel(erro.mensagem)
            is ErroRepositorio.ItemNaoEncontrado -> EstadoCofre.ErroRecuperavel(erro.mensagem)
            is ErroRepositorio.Desconhecido -> EstadoCofre.ErroRecuperavel(erro.mensagem)
        }
    }

    /** Chamado pela UI depois de mostrar a explicação de [EstadoCofre.ChaveInvalidada] ao usuário. */
    fun reconhecerChaveInvalidada() {
        _estado.value = EstadoCofre.RestauracaoNecessaria
    }

    /** Ativa a proteção — exige o cofre já desbloqueado (não é chamado durante o fluxo de desbloqueio). */
    suspend fun ativarProtecao(permitirCredencialDispositivo: Boolean = true) {
        preferencias.definirPoliticaProtecao(PoliticaProtecao.Ativada(permitirCredencialDispositivo))
    }

    /** Altera parâmetros de uma proteção já ativa (ex.: permitir ou não credencial do dispositivo). */
    suspend fun alterarProtecao(permitirCredencialDispositivo: Boolean) =
        ativarProtecao(permitirCredencialDispositivo)

    suspend fun removerProtecao() {
        preferencias.definirPoliticaProtecao(PoliticaProtecao.Nenhuma)
    }

    suspend fun politicaAtual(): PoliticaProtecao = preferencias.politicaProtecao()

    suspend fun definirTimeoutInatividade(valorMs: Long) = preferencias.definirTimeoutInatividadeMs(valorMs)

    /** Chamado pelo host (Activity.onPause / scenePhase .background) a cada saída de primeiro plano. */
    fun notificarAppEmSegundoPlano() {
        momentoEntrouEmSegundoPlanoMs = relogio.agoraEmEpocaMs()
        escopo.launch { provedorChaveMestra.invalidarCacheEmMemoria() }
    }

    /** Chamado pelo host (Activity.onResume / scenePhase .active) a cada volta ao primeiro plano. */
    fun notificarAppEmPrimeiroPlano() {
        val entrouEm = momentoEntrouEmSegundoPlanoMs ?: return
        momentoEntrouEmSegundoPlanoMs = null
        if (_estado.value != EstadoCofre.Desbloqueado) return

        escopo.launch {
            val timeout = preferencias.timeoutInatividadeMs()
            val decorrido = relogio.agoraEmEpocaMs() - entrouEm
            if (decorrido >= timeout) {
                mutex.withLock { repositorio.fechar() }
                avaliarInicio()
            }
        }
    }
}
