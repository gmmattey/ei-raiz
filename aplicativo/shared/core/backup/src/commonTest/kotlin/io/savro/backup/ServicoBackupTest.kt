package io.savro.backup

import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest

class ServicoBackupTest {

    private val senha = "senha-do-usuario"

    private fun montar(
        repositorio: RepositorioDeTeste = RepositorioDeTeste(),
        preferencias: PreferenciasDeTeste = PreferenciasDeTeste(),
        arquivos: ArquivosDoSistemaDeTeste = ArquivosDoSistemaDeTeste(),
        area: AreaTemporariaDeTeste = AreaTemporariaDeTeste(),
    ) = ServicoBackup(
        repositorio = repositorio,
        preferencias = preferencias,
        arquivos = arquivos,
        areaTemporaria = area,
        relogio = RelogioFixo(),
        versaoEsquemaAtual = VERSAO_ESQUEMA_DE_TESTE,
        iteracoesKdf = ITERACOES_DE_TESTE,
    )

    private fun repositorioComDados(): RepositorioDeTeste = RepositorioDeTeste(
        itens = linkedMapOf(
            "a" to itemDeTeste("a"),
            "b" to itemDeTeste("b", moeda = "USD"),
        ),
        ajustes = mutableListOf(ajusteDeTeste("aj-1", "a")),
        eventos = mutableListOf(eventoDeTeste("ev-1", "a")),
    )

    @Test
    fun snapshotIncluiItensAjustesEventosEPreferencias() = runTest {
        val servico = montar(
            repositorio = repositorioComDados(),
            preferencias = PreferenciasDeTeste(PreferenciasBackup(timeoutInatividadeMs = 300_000L)),
        )

        val resultado = servico.montarConteudo()

        assertTrue(resultado is Resultado.Sucesso)
        assertEquals(2, resultado.valor.itens.size)
        assertEquals(1, resultado.valor.ajustes.size)
        assertEquals(1, resultado.valor.eventos.size)
        assertEquals(300_000L, resultado.valor.preferencias.timeoutInatividadeMs)
        assertEquals(VERSAO_ESQUEMA_DE_TESTE, resultado.valor.versaoEsquema)
    }

    @Test
    fun temporarioEhRemovidoAposSucesso() = runTest {
        val area = AreaTemporariaDeTeste()
        val arquivos = ArquivosDoSistemaDeTeste()

        val resultado = montar(repositorio = repositorioComDados(), arquivos = arquivos, area = area)
            .gerarBackup(senha)

        assertEquals(Resultado.Sucesso(Unit), resultado)
        assertEquals(1, area.gravados.size)
        assertTrue(area.arquivos.isEmpty(), "temporário deveria ter sido removido")
        assertTrue(arquivos.nomeRecebido!!.endsWith(".savrobackup"))
    }

    @Test
    fun temporarioEhRemovidoAposCancelamento() = runTest {
        val area = AreaTemporariaDeTeste()
        val arquivos = ArquivosDoSistemaDeTeste().apply { respostaDeSalvar = false }

        val resultado = montar(arquivos = arquivos, area = area).gerarBackup(senha)

        assertEquals(Resultado.Falha(ErroBackup.CanceladoPeloUsuario), resultado)
        assertTrue(area.arquivos.isEmpty())
    }

    @Test
    fun temporarioEhRemovidoAposErroDoSeletor() = runTest {
        val area = AreaTemporariaDeTeste()
        val arquivos = ArquivosDoSistemaDeTeste().apply { falharAoSalvar = true }

        val resultado = montar(arquivos = arquivos, area = area).gerarBackup(senha)

        assertTrue(resultado is Resultado.Falha && resultado.erro is ErroBackup.FalhaDeArquivo)
        assertTrue(area.arquivos.isEmpty())
    }

    @Test
    fun exportacaoCsvTambemLimpaOTemporario() = runTest {
        val area = AreaTemporariaDeTeste()
        val arquivos = ArquivosDoSistemaDeTeste()

        val resultado = montar(repositorio = repositorioComDados(), arquivos = arquivos, area = area)
            .exportarCsv()

        assertEquals(Resultado.Sucesso(Unit), resultado)
        assertTrue(arquivos.nomeRecebido!!.endsWith(".csv"))
        assertTrue(area.arquivos.isEmpty())
    }

    @Test
    fun senhaFracaNaoChegaAGerarArquivo() = runTest {
        val area = AreaTemporariaDeTeste()

        val resultado = montar(area = area).gerarBackup("1234")

        assertEquals(Resultado.Falha(ErroBackup.SenhaFraca), resultado)
        assertTrue(area.gravados.isEmpty())
    }

    @Test
    fun previaMostraImpactoSobreOCofreAtual() = runTest {
        val origem = montar(repositorio = repositorioComDados())
        val conteudo = (origem.montarConteudo() as Resultado.Sucesso).valor
        val arquivo = (CodecArquivoBackup.gerar(conteudo, senha, ITERACOES_DE_TESTE) as Resultado.Sucesso).valor

        val destino = RepositorioDeTeste(itens = linkedMapOf("z" to itemDeTeste("z")))
        val resultado = montar(repositorio = destino).prepararRestauracao(arquivo, senha)

        assertTrue(resultado is Resultado.Sucesso)
        assertEquals(2, resultado.valor.previa.totalDeItens)
        assertEquals(1, resultado.valor.previa.itensNoCofreAtual)
        assertEquals(listOf("BRL", "USD"), resultado.valor.previa.moedas)
        assertEquals(1_780_000_000_000L, resultado.valor.previa.criadoEmEpocaMs)
        // Validar não pode ter escrito nada.
        assertEquals(setOf("z"), destino.itens.keys)
    }

    @Test
    fun arquivoInvalidoNaoAlteraOCofreAtual() = runTest {
        val destino = RepositorioDeTeste(itens = linkedMapOf("z" to itemDeTeste("z")))
        val servico = montar(repositorio = destino)
        val lixo = ByteArray(300) { it.toByte() }

        val resultado = servico.prepararRestauracao(lixo, senha)

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), resultado)
        assertEquals(setOf("z"), destino.itens.keys)
        assertEquals(1, destino.itens.size)
    }

    @Test
    fun restauracaoSubstituiTudoEPreservaHistorico() = runTest {
        val conteudo = (montar(repositorio = repositorioComDados()).montarConteudo() as Resultado.Sucesso).valor

        val destino = RepositorioDeTeste(
            itens = linkedMapOf("antigo" to itemDeTeste("antigo")),
            ajustes = mutableListOf(ajusteDeTeste("aj-antigo", "antigo")),
            eventos = mutableListOf(eventoDeTeste("ev-antigo", "antigo")),
        )
        val preferencias = PreferenciasDeTeste()
        val servico = montar(repositorio = destino, preferencias = preferencias)

        val resultado = servico.aplicarRestauracao(conteudo.copy(preferencias = PreferenciasBackup(120_000L)))

        assertEquals(Resultado.Sucesso(Unit), resultado)
        assertEquals(listOf("a", "b"), destino.itens.keys.toList())
        assertEquals(listOf("aj-1"), destino.ajustes.map { it.id })
        assertEquals(listOf("ev-1"), destino.eventos.map { it.id })
        assertEquals(120_000L, preferencias.valor.timeoutInatividadeMs)
    }

    @Test
    fun restauracaoPreservaAsDatasOriginaisDosItens() = runTest {
        val conteudo = conteudoDeTeste(ajustes = emptyList(), eventos = emptyList())
        val destino = RepositorioDeTeste()

        montar(repositorio = destino).aplicarRestauracao(conteudo)

        val restaurado = destino.itens.getValue("a")
        assertEquals(1_700_000_000_000L, restaurado.criadoEmEpocaMs)
        assertEquals(1_700_000_001_000L, restaurado.atualizadoEmEpocaMs)
    }

    @Test
    fun falhaNoMeioDaRestauracaoRevertreTudo() = runTest {
        val destino = RepositorioDeTeste(
            itens = linkedMapOf("antigo" to itemDeTeste("antigo")),
            ajustes = mutableListOf(ajusteDeTeste("aj-antigo", "antigo")),
            eventos = mutableListOf(eventoDeTeste("ev-antigo", "antigo")),
        ).apply { falharNaInsercaoDeNumero = 2 }
        val preferencias = PreferenciasDeTeste(PreferenciasBackup(60_000L))
        val servico = montar(repositorio = destino, preferencias = preferencias)

        val resultado = servico.aplicarRestauracao(
            conteudoDeTeste(
                itens = listOf(itemDeTeste("a"), itemDeTeste("b")),
                ajustes = emptyList(),
                eventos = emptyList(),
                preferencias = PreferenciasBackup(999_000L),
            ),
        )

        assertTrue(resultado is Resultado.Falha && resultado.erro is ErroBackup.FalhaDeCofre)
        assertEquals(listOf("antigo"), destino.itens.keys.toList())
        assertEquals(listOf("aj-antigo"), destino.ajustes.map { it.id })
        assertEquals(listOf("ev-antigo"), destino.eventos.map { it.id })
        assertEquals(60_000L, preferencias.valor.timeoutInatividadeMs)
    }

    @Test
    fun falhaDeLeituraDoCofreNaoViraArquivoInvalido() = runTest {
        val repositorio = RepositorioDeTeste().apply {
            falhaDeLeitura = ErroRepositorio.ChaveInvalida("chave revogada")
        }

        val resultado = montar(repositorio = repositorio).montarConteudo()

        assertEquals(Resultado.Falha(ErroBackup.FalhaDeCofre("chave")), resultado)
    }

    @Test
    fun selecaoCanceladaNaoEhTratadaComoErroDeArquivo() = runTest {
        val arquivos = ArquivosDoSistemaDeTeste().apply { conteudoSelecionado = null }

        val resultado = montar(arquivos = arquivos).selecionarArquivoDeBackup()

        assertEquals(Resultado.Falha(ErroBackup.CanceladoPeloUsuario), resultado)
    }

    @Test
    fun fluxoCompletoDeRestauracaoAPartirDoArquivoSelecionado() = runTest {
        val origem = montar(repositorio = repositorioComDados())
        val conteudo = (origem.montarConteudo() as Resultado.Sucesso).valor
        val arquivo = (CodecArquivoBackup.gerar(conteudo, senha, ITERACOES_DE_TESTE) as Resultado.Sucesso).valor

        val destino = RepositorioDeTeste(itens = linkedMapOf("z" to itemDeTeste("z")))
        val arquivos = ArquivosDoSistemaDeTeste().apply { conteudoSelecionado = arquivo }
        val servico = montar(repositorio = destino, arquivos = arquivos)

        val selecionado = servico.selecionarArquivoDeBackup()
        assertTrue(selecionado is Resultado.Sucesso)
        val preparada = servico.prepararRestauracao(selecionado.valor, senha)
        assertTrue(preparada is Resultado.Sucesso)
        assertEquals(Resultado.Sucesso(Unit), servico.aplicarRestauracao(preparada.valor.conteudo))

        assertEquals(listOf("a", "b"), destino.itens.keys.toList())
    }
}
