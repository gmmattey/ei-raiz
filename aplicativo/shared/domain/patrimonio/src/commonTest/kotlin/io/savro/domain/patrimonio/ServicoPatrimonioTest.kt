package io.savro.domain.patrimonio

import io.savro.common.Resultado
import io.savro.model.TipoEventoTimeline
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

    // --- Linha do tempo básica (issue #120) — os 5 tipos de evento e reatividade imediata. ---

    @Test
    fun criar_registraEventoItemCriadoNaTimelineImediatamente() = runTest {
        val (servico, _, _) = novoServico()
        val criado = (servico.criar(estadoConta(nome = "Conta Itaú")) as Resultado.Sucesso).valor

        assertEquals(1, servico.timeline.value.size)
        val evento = servico.timeline.value.single()
        assertEquals(TipoEventoTimeline.ITEM_CRIADO, evento.tipo)
        assertEquals(criado.id, evento.itemId)
        assertEquals("Conta Itaú", evento.itemNome)
    }

    @Test
    fun editar_registraEventoItemEditadoNaTimeline() = runTest {
        val relogio = RelogioDeTesteSimples()
        val (servico, _, rel) = novoServico(relogio)
        val criado = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        rel.avancar(1_000)
        servico.editar(estadoConta(nome = "Conta renomeada").copy(itemIdEmEdicao = criado.id))

        assertEquals(TipoEventoTimeline.ITEM_EDITADO, servico.timeline.value.first().tipo)
    }

    @Test
    fun ajustarValor_registraEventoValorAjustadoNaTimeline() = runTest {
        val relogio = RelogioDeTesteSimples()
        val (servico, _, rel) = novoServico(relogio)
        val criado = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        rel.avancar(1_000)
        servico.ajustarValor(criado.id, "2.000,00")

        assertEquals(TipoEventoTimeline.VALOR_AJUSTADO, servico.timeline.value.first().tipo)
    }

    @Test
    fun arquivarEReativar_registramEventosDistintosNaTimeline() = runTest {
        val relogio = RelogioDeTesteSimples()
        val (servico, _, rel) = novoServico(relogio)
        val criado = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        rel.avancar(1_000)
        servico.arquivar(criado.id, arquivado = true)
        assertEquals(TipoEventoTimeline.ITEM_ARQUIVADO, servico.timeline.value.first().tipo)

        rel.avancar(1_000)
        servico.arquivar(criado.id, arquivado = false)
        assertEquals(TipoEventoTimeline.ITEM_REATIVADO, servico.timeline.value.first().tipo)

        // criado + arquivado + reativado — todos os eventos ficam registrados, nenhum é perdido.
        assertEquals(3, servico.timeline.value.size)
    }

    @Test
    fun arquivar_semMudarEstado_naoRegistraEventoDuplicado() = runTest {
        val (servico, _, _) = novoServico()
        val criado = (servico.criar(estadoConta()) as Resultado.Sucesso).valor

        servico.arquivar(criado.id, arquivado = false) // já não está arquivado — noop
        assertEquals(1, servico.timeline.value.size) // só o ITEM_CRIADO
    }

    @Test
    fun duplicar_registraEventoItemCriadoParaACopia() = runTest {
        val (servico, _, _) = novoServico()
        val original = (servico.criar(estadoConta()) as Resultado.Sucesso).valor
        servico.duplicar(original.id)

        val eventosDeCriacao = servico.timeline.value.filter { it.tipo == TipoEventoTimeline.ITEM_CRIADO }
        assertEquals(2, eventosDeCriacao.size)
    }

    @Test
    fun listarTimelineDoItem_filtraApenasEventosDoItemInformado() = runTest {
        val (servico, _, _) = novoServico()
        val item1 = (servico.criar(estadoConta(nome = "Item 1")) as Resultado.Sucesso).valor
        val item2 = (servico.criar(estadoConta(nome = "Item 2")) as Resultado.Sucesso).valor
        servico.ajustarValor(item1.id, "50,00")

        val timelineItem1 = (servico.listarTimelineDoItem(item1.id) as Resultado.Sucesso).valor
        assertEquals(2, timelineItem1.size) // CRIADO + VALOR_AJUSTADO
        assertTrue(timelineItem1.all { it.itemId == item1.id })

        val timelineItem2 = (servico.listarTimelineDoItem(item2.id) as Resultado.Sucesso).valor
        assertEquals(1, timelineItem2.size)
    }
}
