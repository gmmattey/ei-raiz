package io.savro.database

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.GeradorIdItem
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.domain.patrimonio.TransacaoItensPatrimoniais
import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
import io.savro.model.TipoEventoTimeline
import io.savro.domain.patrimonio.ProvedorChaveMestra
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Implementação em memória de [RepositorioItensPatrimoniais], usada por
 * [RepositorioItensPatrimoniaisContratoTeste] para validar o comportamento comum sem depender de
 * engine real. Reproduz as regras do contrato que não dependem de engine física: gate de
 * `abrir()`, chave inválida, transação atômica com rollback, e serialização de escritas
 * concorrentes via [Mutex] (equivalente lógico ao que Room/SQLCipher fazem com sua conexão).
 */
class FakeRepositorioItensPatrimoniais(
    private val provedorChaveMestra: ProvedorChaveMestra,
    private val relogio: Relogio,
    private val versaoEsquema: Int = EsquemaSavro.VERSAO_ATUAL,
) : RepositorioItensPatrimoniais {

    private val mutex = Mutex()
    private val itens = LinkedHashMap<String, ItemPatrimonial>()
    private val ajustes = mutableListOf<AjusteValorItem>()
    private val timeline = mutableListOf<EventoTimelineItem>()
    private var aberto = false

    override suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio> = mutex.withLock {
        when (val resultadoChave = provedorChaveMestra.obterOuCriarChave()) {
            is Resultado.Falha -> Resultado.Falha(resultadoChave.erro)
            is Resultado.Sucesso -> {
                aberto = true
                Resultado.Sucesso(MetadadosBancoLocal(versaoEsquema, itens.size))
            }
        }
    }

    override suspend fun fechar() {
        mutex.withLock { aberto = false }
    }

    override suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        mutex.withLock {
            exigirAberto()?.let { return@withLock Resultado.Falha(it) }
            val agora = relogio.agoraEmEpocaMs()
            val itemComTimestamps = item.copy(criadoEmEpocaMs = agora, atualizadoEmEpocaMs = agora)
            itens[itemComTimestamps.id] = itemComTimestamps
            Resultado.Sucesso(itemComTimestamps)
        }

    override suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        mutex.withLock {
            exigirAberto()?.let { return@withLock Resultado.Falha(it) }
            if (!itens.containsKey(item.id)) {
                return@withLock Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(item.id))
            }
            val atualizado = item.copy(atualizadoEmEpocaMs = relogio.agoraEmEpocaMs())
            itens[atualizado.id] = atualizado
            Resultado.Sucesso(atualizado)
        }

    override suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        if (itens.remove(id) == null) {
            return@withLock Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(id))
        }
        // Simula `ON DELETE CASCADE` (ajustes_valor_item/eventos_timeline_item) — mesmo
        // comportamento que Room (FK habilitada por padrão) e SQLCipher (desde a correção do
        // `PRAGMA foreign_keys` feita na #120).
        ajustes.removeAll { it.itemId == id }
        timeline.removeAll { it.itemId == id }
        Resultado.Sucesso(Unit)
    }

    override suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        Resultado.Sucesso(itens[id])
    }

    override suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        Resultado.Sucesso(itens.values.toList())
    }

    override suspend fun registrarAjusteDeValor(
        itemId: String,
        novoValorCentavos: Long,
        dataEpocaMs: Long,
    ): Resultado<ItemPatrimonial, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        val existente = itens[itemId] ?: return@withLock Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))

        val ajuste = AjusteValorItem(
            id = GeradorIdItem.novoId(),
            itemId = itemId,
            valorCentavosAnterior = existente.valorCentavos,
            valorCentavosNovo = novoValorCentavos,
            origem = existente.origem,
            dataEpocaMs = dataEpocaMs,
        )
        val atualizado = existente.copy(valorCentavos = novoValorCentavos, atualizadoEmEpocaMs = dataEpocaMs)
        ajustes += ajuste
        itens[itemId] = atualizado
        Resultado.Sucesso(atualizado)
    }

    override suspend fun listarAjustesDeValor(itemId: String): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        mutex.withLock {
            exigirAberto()?.let { return@withLock Resultado.Falha(it) }
            Resultado.Sucesso(ajustes.filter { it.itemId == itemId })
        }

    override suspend fun listarTodosOsAjustes(): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        mutex.withLock {
            exigirAberto()?.let { return@withLock Resultado.Falha(it) }
            Resultado.Sucesso(ajustes.sortedBy { it.dataEpocaMs })
        }

    override suspend fun registrarEventoTimeline(
        itemId: String,
        itemNome: String,
        tipo: TipoEventoTimeline,
        dataEpocaMs: Long,
    ): Resultado<EventoTimelineItem, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        val evento = EventoTimelineItem(
            id = GeradorIdItem.novoId(),
            itemId = itemId,
            itemNome = itemNome,
            tipo = tipo,
            dataEpocaMs = dataEpocaMs,
        )
        timeline += evento
        Resultado.Sucesso(evento)
    }

    override suspend fun listarTimeline(itemId: String?): Resultado<List<EventoTimelineItem>, ErroRepositorio> =
        mutex.withLock {
            exigirAberto()?.let { return@withLock Resultado.Falha(it) }
            val filtrada = if (itemId == null) timeline else timeline.filter { it.itemId == itemId }
            Resultado.Sucesso(filtrada.sortedByDescending { it.dataEpocaMs })
        }

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        val instantaneoItens = LinkedHashMap(itens)
        val instantaneoAjustes = ajustes.toList()
        val instantaneoTimeline = timeline.toList()
        val transacao = TransacaoEmMemoria(itens, ajustes, timeline, relogio)
        return@withLock try {
            transacao.bloco()
            Resultado.Sucesso(Unit)
        } catch (excecao: Exception) {
            itens.clear()
            itens.putAll(instantaneoItens)
            ajustes.clear()
            ajustes.addAll(instantaneoAjustes)
            timeline.clear()
            timeline.addAll(instantaneoTimeline)
            Resultado.Falha(ErroRepositorio.FalhaTransacao(excecao.message ?: "Transação revertida"))
        }
    }

    private fun exigirAberto(): ErroRepositorio? =
        if (!aberto) ErroRepositorio.FalhaAbertura("Repositório chamado antes de abrir()") else null

    private class TransacaoEmMemoria(
        private val itens: MutableMap<String, ItemPatrimonial>,
        private val ajustes: MutableList<AjusteValorItem>,
        private val timeline: MutableList<EventoTimelineItem>,
        private val relogio: Relogio,
    ) : TransacaoItensPatrimoniais {
        override suspend fun inserir(item: ItemPatrimonial) {
            val agora = relogio.agoraEmEpocaMs()
            itens[item.id] = item.copy(criadoEmEpocaMs = agora, atualizadoEmEpocaMs = agora)
        }

        override suspend fun atualizar(item: ItemPatrimonial) {
            if (!itens.containsKey(item.id)) error("Item '${item.id}' não encontrado na transação")
            itens[item.id] = item.copy(atualizadoEmEpocaMs = relogio.agoraEmEpocaMs())
        }

        override suspend fun excluir(id: String) {
            if (itens.remove(id) == null) error("Item '$id' não encontrado na transação")
            ajustes.removeAll { it.itemId == id }
            timeline.removeAll { it.itemId == id }
        }

        override suspend fun apagarTudo() {
            timeline.clear()
            ajustes.clear()
            itens.clear()
        }

        override suspend fun inserirItemRestaurado(item: ItemPatrimonial) {
            if (itens.containsKey(item.id)) error("Item '${item.id}' já existe na transação")
            itens[item.id] = item
        }

        override suspend fun inserirAjusteRestaurado(ajuste: AjusteValorItem) {
            if (!itens.containsKey(ajuste.itemId)) error("Ajuste '${ajuste.id}' sem item correspondente")
            ajustes += ajuste
        }

        override suspend fun inserirEventoRestaurado(evento: EventoTimelineItem) {
            if (!itens.containsKey(evento.itemId)) error("Evento '${evento.id}' sem item correspondente")
            timeline += evento
        }
    }
}
