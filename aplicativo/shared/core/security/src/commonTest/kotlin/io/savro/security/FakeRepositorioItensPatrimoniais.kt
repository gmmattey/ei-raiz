package io.savro.security

import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.domain.patrimonio.TransacaoItensPatrimoniais
import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
import io.savro.model.TipoEventoTimeline

/**
 * Fake mínimo de [RepositorioItensPatrimoniais] para `GerenciadorCofreTest` — só `abrir()`/
 * `fechar()` importam para a máquina de estados do cofre; as demais operações não são exercitadas
 * por este teste (o CRUD já tem sua própria suíte de contrato em `:shared:core:database`).
 */
class FakeRepositorioItensPatrimoniais(
    var erroAoAbrir: ErroRepositorio? = null,
) : RepositorioItensPatrimoniais {

    var vezesAberto: Int = 0
        private set
    var vezesFechado: Int = 0
        private set
    private var aberto = false

    override suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio> {
        vezesAberto += 1
        val erro = erroAoAbrir
        return if (erro != null) {
            Resultado.Falha(erro)
        } else {
            aberto = true
            Resultado.Sucesso(MetadadosBancoLocal(versaoEsquema = 2, totalDeItens = 0))
        }
    }

    override suspend fun fechar() {
        vezesFechado += 1
        aberto = false
    }

    override suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        Resultado.Sucesso(item)

    override suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        Resultado.Sucesso(item)

    override suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio> = Resultado.Sucesso(Unit)

    override suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio> =
        Resultado.Sucesso(null)

    override suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio> =
        Resultado.Sucesso(emptyList())

    override suspend fun registrarAjusteDeValor(
        itemId: String,
        novoValorCentavos: Long,
        dataEpocaMs: Long,
    ): Resultado<ItemPatrimonial, ErroRepositorio> = Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))

    override suspend fun listarAjustesDeValor(itemId: String): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        Resultado.Sucesso(emptyList())

    override suspend fun listarTodosOsAjustes(): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        Resultado.Sucesso(emptyList())

    override suspend fun registrarEventoTimeline(
        itemId: String,
        itemNome: String,
        tipo: TipoEventoTimeline,
        dataEpocaMs: Long,
    ): Resultado<EventoTimelineItem, ErroRepositorio> = Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))

    override suspend fun listarTimeline(itemId: String?): Resultado<List<EventoTimelineItem>, ErroRepositorio> =
        Resultado.Sucesso(emptyList())

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> = Resultado.Sucesso(Unit)
}
