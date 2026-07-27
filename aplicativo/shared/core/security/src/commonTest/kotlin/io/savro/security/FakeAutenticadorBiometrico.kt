package io.savro.security

class FakeAutenticadorBiometrico(
    var disponibilidadeSimulada: DisponibilidadeBiometria = DisponibilidadeBiometria.Disponivel,
    var resultadoSimulado: ResultadoAutenticacao = ResultadoAutenticacao.Sucesso,
) : AutenticadorBiometrico {

    var vezesChamado: Int = 0
        private set
    var ultimoPermitirCredencialDispositivo: Boolean? = null
        private set

    override suspend fun disponibilidade(): DisponibilidadeBiometria = disponibilidadeSimulada

    override suspend fun autenticar(motivo: String, permitirCredencialDispositivo: Boolean): ResultadoAutenticacao {
        vezesChamado += 1
        ultimoPermitirCredencialDispositivo = permitirCredencialDispositivo
        return resultadoSimulado
    }
}
