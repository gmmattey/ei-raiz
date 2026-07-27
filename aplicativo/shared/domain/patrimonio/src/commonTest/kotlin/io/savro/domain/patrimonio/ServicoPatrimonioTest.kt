package io.savro.domain.patrimonio

import io.savro.common.Resultado
import io.savro.model.TipoItemPatrimonial
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class ServicoPatrimonioTest {

    private fun novoServico(
        relogio: RelogioDeTesteSimples = RelogioDeTesteSimples(),
        repositorio: FakeRepositorioItensPatrimoniaisSimples = FakeRepositorioItensPatrimoniaisSimples(relogio),
    ) = Triple(ServicoPatrimonio(repositorio, relogio), repositorio, relogio)

    private fun estadoConta(nome: String = "Conta corrente", valor: String = "1000,00") =
        EstadoFormularioItemPatrimonial(tipo = TipoItemPatrimonial.CONTA, nome = nome, valorTexto = valor, moeda = "BRL")

    @Test
    fun criar_comFormularioValido_persisteEAtualizaEstadoReativo() = runTest {
        val (servico, _, _) = novoServico()

        val resultado = servico.criar(estadoConta())
        assertIs<Resultado.Sucesso<*>>(resultado)

        // "atualizar Home e Patrimônio imediatamente" — o StateFlow reflete a escrita sem chamada
        // explícita de recarregar por quem observa.
        assertEquals(1, servico.itens.value.size)
        assertEquals("Conta corrente", servico.itens.value.single().nome)
    }

    @Test
    fun criar_comFormularioInvalido_naoPersisteNadaERetornaErrosDeValidacao() = runTest {
        val (servico, _, _) = novoServico()

        val resultado = servico.criar(estadoConta(nome = ""))
        assertIs<Resultado.Falha<ErroServicoPatrimonio.ValidacaoFalhou>>(resultado)
        assertTrue(ErroValidacaoItem.NomeObrigatorio in resultado.erro.erros)
        assertEquals(0, servico.itens.value.size)
    }

    @Test
    fun criar_comFalhaDePersistencia_naoDeixaItemParcialNoEstadoReativo() = runTest {
        val relogio = RelogioDeTesteSimples()
        val repositorio = FakeRepositorioItensPatrimoniaisSimples(relogio)
        val (servico, _, _) = novoServico(relogio, repositorio)

        repositorio.falhaSimulada = ErroRepositorio.FalhaTransacao("disco cheio")
        val resultado = servico.criar(estadoConta())

        assertIs<Resultado.Falha<ErroServicoPatrimonio.Persistencia>>(resultado)
        assertEquals(0, servico.itens.value.size)
    }

    @Test
    fun editar_alteraCamposEMantemId() = runTest {
        val (servico, _, _) = novoServico()
        val criado = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        val editado = servico.editar(
            estadoConta(nome = "Conta poupança", valor = "2000,00").copy(itemIdEmEdicao = criado.id),
        )
        assertIs<Resultado.Sucesso<*>>(editado)
        assertEquals("Conta poupança", servico.itens.value.single().nome)
        assertEquals(criado.id, servico.itens.value.single().id)
        assertEquals(200_000L, servico.itens.value.single().valorCentavos)
    }

    @Test
    fun editar_itemInexistente_retornaItemNaoEncontrado() = runTest {
        val (servico, _, _) = novoServico()
        val resultado = servico.editar(estadoConta().copy(itemIdEmEdicao = "nao-existe"))
        assertIs<Resultado.Falha<ErroServicoPatrimonio.ItemNaoEncontrado>>(resultado)
    }

    @Test
    fun duplicar_criaNovoItemIndependenteComNomeDistinto() = runTest {
        val (servico, _, _) = novoServico()
        val original = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        val duplicado = servico.duplicar(original.id)
        assertIs<Resultado.Sucesso<*>>(duplicado)
        assertEquals(2, servico.itens.value.size)
        assertTrue(servico.itens.value.any { it.id != original.id && it.nome.contains("cópia") })
    }

    @Test
    fun arquivar_removeDaListagemPadraoMasMantemNoBanco() = runTest {
        val (servico, _, _) = novoServico()
        val item = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        val arquivado = servico.arquivar(item.id, arquivado = true)
        assertIs<Resultado.Sucesso<*>>(arquivado)

        val visiveis = servico.buscarEFiltrar(FiltroItensPatrimoniais())
        assertEquals(0, visiveis.size)

        val comArquivados = servico.buscarEFiltrar(FiltroItensPatrimoniais(incluirArquivados = true))
        assertEquals(1, comArquivados.size)
    }

    @Test
    fun excluir_removePermanentementeEAtualizaEstadoReativo() = runTest {
        val (servico, _, _) = novoServico()
        val item = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        val resultado = servico.excluir(item.id)
        assertIs<Resultado.Sucesso<Unit>>(resultado)
        assertEquals(0, servico.itens.value.size)
    }

    @Test
    fun ajustarValor_preservaDataEOrigemDoAjuste() = runTest {
        val relogio = RelogioDeTesteSimples(agora = 5_000L)
        val repositorio = FakeRepositorioItensPatrimoniaisSimples(relogio)
        val (servico, repo, rel) = novoServico(relogio, repositorio)
        val item = (servico.criar(estadoConta(valor = "1000,00")) as Resultado.Sucesso).valor

        rel.avancar(1_000)
        val resultado = servico.ajustarValor(item.id, "1.500,00")
        assertIs<Resultado.Sucesso<*>>(resultado)
        assertEquals(150_000L, servico.itens.value.single().valorCentavos)
        assertEquals(6_000L, servico.itens.value.single().atualizadoEmEpocaMs)

        val ajustes = (repo.listarAjustesDeValor(item.id) as Resultado.Sucesso).valor
        assertEquals(1, ajustes.size)
        assertEquals(100_000L, ajustes.single().valorCentavosAnterior)
        assertEquals(150_000L, ajustes.single().valorCentavosNovo)
        assertEquals(6_000L, ajustes.single().dataEpocaMs)
    }

    @Test
    fun ajustarValor_dividaComValorPositivo_eRejeitado() = runTest {
        val (servico, _, _) = novoServico()
        val estadoDivida = EstadoFormularioItemPatrimonial(
            tipo = TipoItemPatrimonial.DIVIDA,
            nome = "Cartão de crédito",
            valorTexto = "-500,00",
            moeda = "BRL",
        )
        val item = (servico.criar(estadoDivida) as Resultado.Sucesso).valor

        val resultado = servico.ajustarValor(item.id, "500,00")
        assertIs<Resultado.Falha<ErroServicoPatrimonio.ValidacaoFalhou>>(resultado)
        assertEquals(-50_000L, servico.itens.value.single().valorCentavos)
    }

    @Test
    fun buscarEFiltrar_combinaTextoETipo() = runTest {
        val (servico, _, _) = novoServico()
        servico.criar(estadoConta(nome = "Conta Nubank"))
        servico.criar(
            EstadoFormularioItemPatrimonial(
                tipo = TipoItemPatrimonial.RENDA_VARIAVEL,
                nome = "Ações Nubank",
                valorTexto = "500,00",
                moeda = "BRL",
            ),
        )

        val resultado = servico.buscarEFiltrar(
            FiltroItensPatrimoniais(texto = "nubank", tipos = setOf(TipoItemPatrimonial.RENDA_VARIAVEL)),
        )
        assertEquals(1, resultado.size)
        assertEquals("Ações Nubank", resultado.single().nome)
    }
}
