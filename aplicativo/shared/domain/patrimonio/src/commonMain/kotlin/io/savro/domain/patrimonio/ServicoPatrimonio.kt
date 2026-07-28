package io.savro.domain.patrimonio

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoEventoTimeline
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** Erro de operação de patrimônio — validação de formulário ou falha de persistência, nunca os dois misturados. */
sealed class ErroServicoPatrimonio {
    data class ValidacaoFalhou(val erros: List<ErroValidacaoItem>) : ErroServicoPatrimonio()
    data class Persistencia(val erro: ErroRepositorio) : ErroServicoPatrimonio()
    data object ItemNaoEncontrado : ErroServicoPatrimonio()
}

/**
 * Orquestra as operações de cadastro manual de patrimônio (issue #119) sobre
 * [RepositorioItensPatrimoniais] e expõe [itens] como estado reativo único — Home e Patrimônio
 * observam a mesma instância deste serviço (via composição do host, `:shared:app`) e por isso se
 * atualizam imediatamente após qualquer alteração, sem chamada explícita de "recarregar tela"
 * (issue: "atualizar Home e Patrimônio imediatamente após qualquer alteração").
 *
 * Cada operação de escrita recarrega [itens] a partir do repositório ao final — a fonte de
 * verdade nunca é o cache em memória, é o banco; o cache só existe para não recarregar
 * silenciosamente em toda leitura de tela.
 */
class ServicoPatrimonio(
    private val repositorio: RepositorioItensPatrimoniais,
    private val relogio: Relogio,
) {
    private val mutexRecarga = Mutex()
    private val _itens = MutableStateFlow<List<ItemPatrimonial>>(emptyList())
    val itens: StateFlow<List<ItemPatrimonial>> = _itens.asStateFlow()

    /**
     * Linha do tempo básica global (issue #120), mais recente primeiro — recarregada no mesmo
     * chokepoint que [itens] ([recarregar]), então Home/Detalhe se atualizam imediatamente junto
     * com os totais, sem chamada explícita adicional.
     */
    private val _timeline = MutableStateFlow<List<EventoTimelineItem>>(emptyList())
    val timeline: StateFlow<List<EventoTimelineItem>> = _timeline.asStateFlow()

    /** Deve ser chamado depois de [RepositorioItensPatrimoniais.abrir] pelo host. */
    suspend fun carregar(): Resultado<List<ItemPatrimonial>, ErroServicoPatrimonio> =
        recarregar()

    fun buscarEFiltrar(filtro: FiltroItensPatrimoniais): List<ItemPatrimonial> =
        filtro.aplicar(_itens.value)

    suspend fun criar(
        estado: EstadoFormularioItemPatrimonial,
    ): Resultado<ItemPatrimonial, ErroServicoPatrimonio> {
        val validado = when (val resultado = ValidadorItemPatrimonial.validar(estado)) {
            is Resultado.Falha -> return Resultado.Falha(ErroServicoPatrimonio.ValidacaoFalhou(resultado.erro))
            is Resultado.Sucesso -> resultado.valor
        }

        val agora = relogio.agoraEmEpocaMs()
        val item = ItemPatrimonial(
            id = GeradorIdItem.novoId(),
            tipo = validado.tipo,
            nome = validado.nome,
            valorCentavos = validado.valorCentavos,
            moeda = validado.moeda,
            instituicao = validado.instituicao,
            observacao = validado.observacao,
            quantidadeMilesimos = validado.quantidadeMilesimos,
            precoMedioCentavos = validado.precoMedioCentavos,
            origem = OrigemValor.MANUAL,
            arquivado = false,
            criadoEmEpocaMs = agora,
            atualizadoEmEpocaMs = agora,
        )

        return when (val resultado = repositorio.inserir(item)) {
            is Resultado.Falha -> Resultado.Falha(ErroServicoPatrimonio.Persistencia(resultado.erro))
            is Resultado.Sucesso -> {
                registrarEvento(resultado.valor.id, resultado.valor.nome, TipoEventoTimeline.ITEM_CRIADO)
                recarregar()
                Resultado.Sucesso(resultado.valor)
            }
        }
    }

    suspend fun editar(
        estado: EstadoFormularioItemPatrimonial,
    ): Resultado<ItemPatrimonial, ErroServicoPatrimonio> {
        val id = estado.itemIdEmEdicao ?: return Resultado.Falha(ErroServicoPatrimonio.ItemNaoEncontrado)
        val existente = _itens.value.firstOrNull { it.id == id }
            ?: return Resultado.Falha(ErroServicoPatrimonio.ItemNaoEncontrado)

        val validado = when (val resultado = ValidadorItemPatrimonial.validar(estado)) {
            is Resultado.Falha -> return Resultado.Falha(ErroServicoPatrimonio.ValidacaoFalhou(resultado.erro))
            is Resultado.Sucesso -> resultado.valor
        }

        val itemAtualizado = existente.copy(
            tipo = validado.tipo,
            nome = validado.nome,
            valorCentavos = validado.valorCentavos,
            moeda = validado.moeda,
            instituicao = validado.instituicao,
            observacao = validado.observacao,
            quantidadeMilesimos = validado.quantidadeMilesimos,
            precoMedioCentavos = validado.precoMedioCentavos,
        )

        return when (val resultado = repositorio.atualizar(itemAtualizado)) {
            is Resultado.Falha -> Resultado.Falha(mapearErroDeAtualizacao(resultado.erro))
            is Resultado.Sucesso -> {
                registrarEvento(resultado.valor.id, resultado.valor.nome, TipoEventoTimeline.ITEM_EDITADO)
                recarregar()
                Resultado.Sucesso(resultado.valor)
            }
        }
    }

    /** Duplica um item existente como um novo item independente (issue #119: operação "duplicar"). */
    suspend fun duplicar(id: String): Resultado<ItemPatrimonial, ErroServicoPatrimonio> {
        val original = _itens.value.firstOrNull { it.id == id }
            ?: return Resultado.Falha(ErroServicoPatrimonio.ItemNaoEncontrado)

        val agora = relogio.agoraEmEpocaMs()
        val copia = original.copy(
            id = GeradorIdItem.novoId(),
            nome = nomeDeCopia(original.nome),
            arquivado = false,
            criadoEmEpocaMs = agora,
            atualizadoEmEpocaMs = agora,
        )

        return when (val resultado = repositorio.inserir(copia)) {
            is Resultado.Falha -> Resultado.Falha(ErroServicoPatrimonio.Persistencia(resultado.erro))
            is Resultado.Sucesso -> {
                registrarEvento(resultado.valor.id, resultado.valor.nome, TipoEventoTimeline.ITEM_CRIADO)
                recarregar()
                Resultado.Sucesso(resultado.valor)
            }
        }
    }

    /** Arquiva ou desarquiva (issue #119: "arquivar" é reversível, distinto de "excluir"). */
    suspend fun arquivar(id: String, arquivado: Boolean): Resultado<ItemPatrimonial, ErroServicoPatrimonio> {
        val existente = _itens.value.firstOrNull { it.id == id }
            ?: return Resultado.Falha(ErroServicoPatrimonio.ItemNaoEncontrado)
        if (existente.arquivado == arquivado) return Resultado.Sucesso(existente)

        return when (val resultado = repositorio.atualizar(existente.copy(arquivado = arquivado))) {
            is Resultado.Falha -> Resultado.Falha(mapearErroDeAtualizacao(resultado.erro))
            is Resultado.Sucesso -> {
                val tipoEvento = if (arquivado) TipoEventoTimeline.ITEM_ARQUIVADO else TipoEventoTimeline.ITEM_REATIVADO
                registrarEvento(resultado.valor.id, resultado.valor.nome, tipoEvento)
                recarregar()
                Resultado.Sucesso(resultado.valor)
            }
        }
    }

    suspend fun excluir(id: String): Resultado<Unit, ErroServicoPatrimonio> =
        when (val resultado = repositorio.excluir(id)) {
            is Resultado.Falha -> Resultado.Falha(mapearErroDeAtualizacao(resultado.erro))
            is Resultado.Sucesso -> {
                recarregar()
                Resultado.Sucesso(Unit)
            }
        }

    /**
     * Ajuste manual de valor (issue #119: "registrar ajuste manual de valor preservando data e
     * origem"). Delega ao repositório, que grava o novo valor no item e o registro histórico
     * atomicamente — nenhuma chance de um sem o outro.
     */
    suspend fun ajustarValor(
        id: String,
        novoValorTexto: String,
    ): Resultado<ItemPatrimonial, ErroServicoPatrimonio> {
        val existente = _itens.value.firstOrNull { it.id == id }
            ?: return Resultado.Falha(ErroServicoPatrimonio.ItemNaoEncontrado)

        val novoValorCentavos = ConversorMonetario.paraCentavos(novoValorTexto)
            ?: return Resultado.Falha(ErroServicoPatrimonio.ValidacaoFalhou(listOf(ErroValidacaoItem.ValorObrigatorio)))

        if (existente.tipo == io.savro.model.TipoItemPatrimonial.DIVIDA && novoValorCentavos > 0) {
            return Resultado.Falha(
                ErroServicoPatrimonio.ValidacaoFalhou(listOf(ErroValidacaoItem.ValorDeDividaDeveSerNegativoOuZero)),
            )
        }
        if (existente.tipo != io.savro.model.TipoItemPatrimonial.DIVIDA && novoValorCentavos < 0) {
            return Resultado.Falha(
                ErroServicoPatrimonio.ValidacaoFalhou(listOf(ErroValidacaoItem.ValorNaoPodeSerNegativo(existente.tipo))),
            )
        }

        val resultado = repositorio.registrarAjusteDeValor(
            itemId = id,
            novoValorCentavos = novoValorCentavos,
            dataEpocaMs = relogio.agoraEmEpocaMs(),
        )
        return when (resultado) {
            is Resultado.Falha -> Resultado.Falha(mapearErroDeAtualizacao(resultado.erro))
            is Resultado.Sucesso -> {
                registrarEvento(resultado.valor.id, resultado.valor.nome, TipoEventoTimeline.VALOR_AJUSTADO)
                recarregar()
                Resultado.Sucesso(resultado.valor)
            }
        }
    }

    suspend fun listarAjustes(id: String) = repositorio.listarAjustesDeValor(id)

    /** Linha do tempo de um item específico (issue #120, tela de Detalhe), mais recente primeiro. */
    suspend fun listarTimelineDoItem(id: String) = repositorio.listarTimeline(itemId = id)

    /** Instante atual — usado pela Home (issue #120) para achar itens desatualizados sem cada tela precisar do próprio [Relogio]. */
    fun agoraEmEpocaMs(): Long = relogio.agoraEmEpocaMs()

    private suspend fun recarregar(): Resultado<List<ItemPatrimonial>, ErroServicoPatrimonio> = mutexRecarga.withLock {
        when (val resultado = repositorio.listarTodos()) {
            is Resultado.Falha -> Resultado.Falha(ErroServicoPatrimonio.Persistencia(resultado.erro))
            is Resultado.Sucesso -> {
                _itens.value = resultado.valor
                val timeline = repositorio.listarTimeline(itemId = null)
                if (timeline is Resultado.Sucesso) _timeline.value = timeline.valor
                Resultado.Sucesso(resultado.valor)
            }
        }
    }

    /**
     * Melhor esforço: a linha do tempo é um registro complementar, não a fonte de verdade do
     * item — uma falha ao gravar o evento não desfaz nem impede a operação principal (que já foi
     * confirmada no repositório antes deste ponto). Nunca chamado antes da escrita principal ter
     * tido sucesso.
     */
    private suspend fun registrarEvento(itemId: String, itemNome: String, tipo: TipoEventoTimeline) {
        repositorio.registrarEventoTimeline(itemId, itemNome, tipo, relogio.agoraEmEpocaMs())
    }

    private fun mapearErroDeAtualizacao(erro: ErroRepositorio): ErroServicoPatrimonio =
        if (erro is ErroRepositorio.ItemNaoEncontrado) {
            ErroServicoPatrimonio.ItemNaoEncontrado
        } else {
            ErroServicoPatrimonio.Persistencia(erro)
        }

    private fun nomeDeCopia(nomeOriginal: String): String {
        val sufixo = " (cópia)"
        return if (nomeOriginal.endsWith(sufixo)) "$nomeOriginal 2" else "$nomeOriginal$sufixo"
    }
}
