package io.savro.security

class FakePreferenciasCofre(
    private var onboardingConcluido: Boolean = false,
    private var politica: PoliticaProtecao = PoliticaProtecao.Nenhuma,
    private var timeoutMs: Long = PreferenciasCofrePadrao.TIMEOUT_INATIVIDADE_MS_PADRAO,
    private var chaveInvalidada: Boolean = false,
) : PreferenciasCofre {

    override suspend fun onboardingConcluido(): Boolean = onboardingConcluido

    override suspend fun marcarOnboardingConcluido() {
        onboardingConcluido = true
    }

    override suspend fun politicaProtecao(): PoliticaProtecao = politica

    override suspend fun definirPoliticaProtecao(politica: PoliticaProtecao) {
        this.politica = politica
    }

    override suspend fun timeoutInatividadeMs(): Long = timeoutMs

    override suspend fun definirTimeoutInatividadeMs(valor: Long) {
        timeoutMs = valor
    }

    override suspend fun chaveInvalidadaPersistida(): Boolean = chaveInvalidada

    override suspend fun marcarChaveInvalidadaPersistida() {
        chaveInvalidada = true
    }
}
