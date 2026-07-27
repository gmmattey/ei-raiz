package io.savro.domain.patrimonio

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.model.AjusteValorItem
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal

/**
 * Fake mínimo para testar [ServicoPatrimonio] sem depender de `:shared:core:database` (que
 * depende de `:shared:domain:patrimonio`, não o contrário — ver ADR-002). Não simula
 * abrir()/chave/transação de verdade: cobre só o que `ServicoPatrimonio` de fato chama. O
 * comportamento de engine real (Room/SQLCipher) é coberto pelo contrato compartilhado em
 * `:shared:core:database` (`RepositorioItensPatrimoniaisContratoTeste`).
 */
class FakeRepositorioItensPatrimoniaisSimples(
    private val relogio: Relogio,
    /** Se != null, toda operação de escrita falha com este erro — simula falha de persistência. */
    var falhaSimulada: ErroRepositorio? = null,
) : RepositorioItensPatrimoniais {

    private val itens = LinkedHashMap<String, ItemPatrimonial>()
    private val ajustes = mutableListOf<AjusteValorItem>()

    override suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio> =
        Resultado.Sucesso(MetadadosBancoLocal(1, itens.size))

    override suspend fun fechar() = Unit

    override suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> {
        falhaSimulada?.let { return Resultado.Falha(it) }
        itens[item.id] = item
        return Resultado.Sucesso(item)
    }

    override suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> {
        falhaSimulada?.let { return Resultado.Falha(it) }
        if (!itens.containsKey(item.id)) return Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(item.id))
        itens[item.id] = item
        return Resultado.Sucesso(item)
    }

    override suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio> {
        falhaSimulada?.let { return Resultado.Falha(it) }
        if (itens.remove(id) == null) return Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(id))
        return Resultado.Sucesso(Unit)
    }

    override suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio> =
        Resultado.Sucesso(itens[id])

    override suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio> =
        Resultado.Sucesso(itens.values.toList())

    override suspend fun registrarAjusteDeValor(
        itemId: String,
        novoValorCentavos: Long,
        dataEpocaMs: Long,
    ): Resultado<ItemPatrimonial, ErroRepositorio> {
        falhaSimulada?.let { return Resultado.Falha(it) }
        val existente = itens[itemId] ?: return Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))
        ajustes += AjusteValorItem(
            id = GeradorIdItem.novoId(),
            itemId = itemId,
            valorCentavosAnterior = existente.valorCentavos,
            valorCentavosNovo = novoValorCentavos,
            origem = existente.origem,
            dataEpocaMs = dataEpocaMs,
        )
        val atualizado = existente.copy(valorCentavos = novoValorCentavos, atualizadoEmEpocaMs = dataEpocaMs)
        itens[itemId] = atualizado
        return Resultado.Sucesso(atualizado)
    }

    override suspend fun listarAjustesDeValor(itemId: String): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        Resultado.Sucesso(ajustes.filter { it.itemId == itemId })

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> = Resultado.Sucesso(Unit)
}

class RelogioDeTesteSimples(private var agora: Long = 1_000L) : Relogio {
    override fun agoraEmEpocaMs(): Long = agora
    fun avancar(ms: Long) {
        agora += ms
    }
}
