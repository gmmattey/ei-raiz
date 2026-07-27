package io.savro.database

import io.savro.domain.patrimonio.RepositorioItensPatrimoniais

/**
 * Roda o contrato comum contra o fake em memória. commonTest é herdado por `androidUnitTest` e
 * `iosTest` — esta suíte executa nas duas plataformas mesmo sem tocar engine real.
 */
class FakeRepositorioItensPatrimoniaisContratoTest : RepositorioItensPatrimoniaisContratoTeste() {

    override suspend fun criarRepositorio(): RepositorioItensPatrimoniais =
        FakeRepositorioItensPatrimoniais(
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = true),
            relogio = RelogioDeTeste(),
        )

    override suspend fun criarRepositorioComChaveInvalida(): RepositorioItensPatrimoniais =
        FakeRepositorioItensPatrimoniais(
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = false),
            relogio = RelogioDeTeste(),
        )
}
