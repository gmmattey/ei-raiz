package io.savro.database

import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.model.AjusteValorItem
import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoItemPatrimonial
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Suíte de comportamento comum a qualquer implementação de [RepositorioItensPatrimoniais] — o
 * mesmo contrato roda contra o fake em memória ([FakeRepositorioItensPatrimoniaisContratoTest],
 * `commonTest`, herdado por `androidUnitTest`/`iosTest`), contra Room+SQLCipher
 * (`androidUnitTest`/`androidInstrumentedTest`, engine real) e contra a implementação iOS
 * (`iosTest`, engine real). Uma suíte concreta só precisa fornecer as duas fábricas abaixo; toda
 * asserção de comportamento vive aqui, uma vez só — é o que a #180 chama de "mesmos testes de
 * comportamento" nas duas plataformas.
 */
abstract class RepositorioItensPatrimoniaisContratoTeste {

    /** Repositório novo, ainda fechado, com material criptográfico válido. */
    protected abstract suspend fun criarRepositorio(): RepositorioItensPatrimoniais

    /** Repositório novo cuja tentativa de abertura deve falhar com [ErroRepositorio.ChaveInvalida]. */
    protected abstract suspend fun criarRepositorioComChaveInvalida(): RepositorioItensPatrimoniais

    /** Hook de limpeza (fechar conexão, apagar arquivo temporário). Sobrescrito por engines reais. */
    protected open suspend fun encerrar(repositorio: RepositorioItensPatrimoniais) {
        repositorio.fechar()
    }

    private fun itemDeTeste(
        id: String = "item-1",
        nome: String = "Conta corrente",
        valorCentavos: Long = 123_456,
        tipo: TipoItemPatrimonial = TipoItemPatrimonial.CONTA,
    ): ItemPatrimonial = ItemPatrimonial(
        id = id,
        tipo = tipo,
        nome = nome,
        valorCentavos = valorCentavos,
        moeda = "BRL",
        instituicao = "Banco Teste",
        observacao = null,
        quantidadeMilesimos = null,
        precoMedioCentavos = null,
        origem = OrigemValor.MANUAL,
        arquivado = false,
        criadoEmEpocaMs = 0,
        atualizadoEmEpocaMs = 0,
    )

    @Test
    fun operacoesAntesDeAbrir_retornamFalhaAbertura() = runTest {
        val repositorio = criarRepositorio()
        val resultado = repositorio.listarTodos()
        assertIs<Resultado.Falha<ErroRepositorio>>(resultado)
        assertIs<ErroRepositorio.FalhaAbertura>(resultado.erro)
    }

    @Test
    fun abrirComChaveInvalida_naoAbreENaoTocaOArquivo() = runTest {
        val repositorio = criarRepositorioComChaveInvalida()
        val resultado = repositorio.abrir()
        assertIs<Resultado.Falha<ErroRepositorio>>(resultado)
        assertIs<ErroRepositorio.ChaveInvalida>(resultado.erro)

        // Banco não abre com chave inválida: operações seguintes continuam recusando, nunca criam
        // ou recriam o arquivo silenciosamente para "contornar" a chave ruim.
        val listagem = repositorio.listarTodos()
        assertIs<Resultado.Falha<ErroRepositorio>>(listagem)
    }

    @Test
    fun inserirEBuscarPorId_retornaItemInserido() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        val item = itemDeTeste()

        val inserido = repositorio.inserir(item)
        assertIs<Resultado.Sucesso<ItemPatrimonial>>(inserido)
        assertTrue(inserido.valor.criadoEmEpocaMs > 0)
        assertTrue(inserido.valor.atualizadoEmEpocaMs > 0)

        val buscado = repositorio.buscarPorId(item.id)
        assertIs<Resultado.Sucesso<ItemPatrimonial?>>(buscado)
        assertEquals(item.nome, buscado.valor?.nome)
        assertEquals(item.valorCentavos, buscado.valor?.valorCentavos)

        encerrar(repositorio)
    }

    @Test
    fun buscarPorId_inexistente_retornaSucessoComNulo() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()

        val resultado = repositorio.buscarPorId("nao-existe")
        assertIs<Resultado.Sucesso<ItemPatrimonial?>>(resultado)
        assertNull(resultado.valor)

        encerrar(repositorio)
    }

    @Test
    fun listarTodos_retornaTodosOsItensInseridos() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        repositorio.inserir(itemDeTeste(id = "item-1"))
        repositorio.inserir(itemDeTeste(id = "item-2"))
        repositorio.inserir(itemDeTeste(id = "item-3"))

        val resultado = repositorio.listarTodos()
        assertIs<Resultado.Sucesso<List<ItemPatrimonial>>>(resultado)
        assertEquals(3, resultado.valor.size)

        encerrar(repositorio)
    }

    @Test
    fun atualizar_alteraCamposEMantemId() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        val item = itemDeTeste()
        repositorio.inserir(item)

        val atualizado = repositorio.atualizar(item.copy(nome = "Conta poupança", valorCentavos = 999))
        assertIs<Resultado.Sucesso<ItemPatrimonial>>(atualizado)
        assertEquals("Conta poupança", atualizado.valor.nome)
        assertEquals(999L, atualizado.valor.valorCentavos)
        assertEquals(item.id, atualizado.valor.id)

        encerrar(repositorio)
    }

    @Test
    fun atualizar_itemInexistente_retornaItemNaoEncontrado() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()

        val resultado = repositorio.atualizar(itemDeTeste(id = "nao-existe"))
        assertIs<Resultado.Falha<ErroRepositorio>>(resultado)
        assertIs<ErroRepositorio.ItemNaoEncontrado>(resultado.erro)

        encerrar(repositorio)
    }

    @Test
    fun excluir_removeItem() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        val item = itemDeTeste()
        repositorio.inserir(item)

        val exclusao = repositorio.excluir(item.id)
        assertIs<Resultado.Sucesso<Unit>>(exclusao)

        val buscado = repositorio.buscarPorId(item.id)
        assertIs<Resultado.Sucesso<ItemPatrimonial?>>(buscado)
        assertNull(buscado.valor)

        encerrar(repositorio)
    }

    @Test
    fun excluir_itemInexistente_retornaItemNaoEncontrado() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()

        val resultado = repositorio.excluir("nao-existe")
        assertIs<Resultado.Falha<ErroRepositorio>>(resultado)
        assertIs<ErroRepositorio.ItemNaoEncontrado>(resultado.erro)

        encerrar(repositorio)
    }

    @Test
    fun fecharEReabrir_mantemDadosPersistidos() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        repositorio.inserir(itemDeTeste())
        repositorio.fechar()

        val reaberto = repositorio.abrir()
        assertIs<Resultado.Sucesso<*>>(reaberto)

        val listagem = repositorio.listarTodos()
        assertIs<Resultado.Sucesso<List<ItemPatrimonial>>>(listagem)
        assertEquals(1, listagem.valor.size)

        encerrar(repositorio)
    }

    @Test
    fun transacao_aplicaTodasAsOperacoesJuntas() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()

        val resultado = repositorio.executarEmTransacao {
            inserir(itemDeTeste(id = "item-1"))
            inserir(itemDeTeste(id = "item-2"))
        }
        assertIs<Resultado.Sucesso<Unit>>(resultado)

        val listagem = repositorio.listarTodos()
        assertIs<Resultado.Sucesso<List<ItemPatrimonial>>>(listagem)
        assertEquals(2, listagem.valor.size)

        encerrar(repositorio)
    }

    @Test
    fun transacao_excecaoReverteTodasAsOperacoesDoBloco() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        repositorio.inserir(itemDeTeste(id = "item-preexistente"))

        val resultado = repositorio.executarEmTransacao {
            inserir(itemDeTeste(id = "item-novo"))
            error("Falha simulada no meio da transação")
        }
        assertIs<Resultado.Falha<ErroRepositorio>>(resultado)
        assertIs<ErroRepositorio.FalhaTransacao>(resultado.erro)

        // Nem o item novo (inserido antes da exceção) nem qualquer efeito parcial sobrevivem — só
        // o estado anterior à transação.
        val listagem = repositorio.listarTodos()
        assertIs<Resultado.Sucesso<List<ItemPatrimonial>>>(listagem)
        assertEquals(1, listagem.valor.size)
        assertEquals("item-preexistente", listagem.valor.single().id)

        encerrar(repositorio)
    }

    @Test
    fun insercoesConcorrentes_naoPerdemNemDuplicamItens() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()

        val totalDeItens = 20
        coroutineScope {
            (1..totalDeItens).map { indice ->
                async { repositorio.inserir(itemDeTeste(id = "item-concorrente-$indice")) }
            }.map { it.await() }
        }

        val listagem = repositorio.listarTodos()
        assertIs<Resultado.Sucesso<List<ItemPatrimonial>>>(listagem)
        assertEquals(totalDeItens, listagem.valor.size)
        assertEquals(totalDeItens, listagem.valor.map { it.id }.toSet().size)

        encerrar(repositorio)
    }

    @Test
    fun arquivar_persisteFlagENaoAlteraOutrosCampos() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        val item = itemDeTeste()
        repositorio.inserir(item)

        val arquivado = repositorio.atualizar(item.copy(arquivado = true))
        assertIs<Resultado.Sucesso<ItemPatrimonial>>(arquivado)
        assertTrue(arquivado.valor.arquivado)
        assertEquals(item.nome, arquivado.valor.nome)

        val buscado = repositorio.buscarPorId(item.id)
        assertIs<Resultado.Sucesso<ItemPatrimonial?>>(buscado)
        assertTrue(buscado.valor?.arquivado == true)

        encerrar(repositorio)
    }

    @Test
    fun registrarAjusteDeValor_atualizaItemEGravaHistoricoAtomicamente() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()
        val item = itemDeTeste(valorCentavos = 1_000)
        repositorio.inserir(item)

        val resultado = repositorio.registrarAjusteDeValor(item.id, novoValorCentavos = 2_500, dataEpocaMs = 999)
        assertIs<Resultado.Sucesso<ItemPatrimonial>>(resultado)
        assertEquals(2_500L, resultado.valor.valorCentavos)
        assertEquals(999L, resultado.valor.atualizadoEmEpocaMs)

        val ajustes = repositorio.listarAjustesDeValor(item.id)
        assertIs<Resultado.Sucesso<List<AjusteValorItem>>>(ajustes)
        assertEquals(1, ajustes.valor.size)
        assertEquals(1_000L, ajustes.valor.single().valorCentavosAnterior)
        assertEquals(2_500L, ajustes.valor.single().valorCentavosNovo)
        assertEquals(999L, ajustes.valor.single().dataEpocaMs)
        assertEquals(OrigemValor.MANUAL, ajustes.valor.single().origem)

        encerrar(repositorio)
    }

    @Test
    fun registrarAjusteDeValor_itemInexistente_retornaItemNaoEncontradoENaoGravaAjuste() = runTest {
        val repositorio = criarRepositorio()
        repositorio.abrir()

        val resultado = repositorio.registrarAjusteDeValor("nao-existe", novoValorCentavos = 1, dataEpocaMs = 1)
        assertIs<Resultado.Falha<ErroRepositorio>>(resultado)
        assertIs<ErroRepositorio.ItemNaoEncontrado>(resultado.erro)

        val ajustes = repositorio.listarAjustesDeValor("nao-existe")
        assertIs<Resultado.Sucesso<List<AjusteValorItem>>>(ajustes)
        assertEquals(0, ajustes.valor.size)

        encerrar(repositorio)
    }
}
