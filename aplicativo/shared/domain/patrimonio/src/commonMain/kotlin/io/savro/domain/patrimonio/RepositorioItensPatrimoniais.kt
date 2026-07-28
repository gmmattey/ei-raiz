package io.savro.domain.patrimonio

import io.savro.common.Resultado
import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
import io.savro.model.TipoEventoTimeline

/**
 * Contrato de persistência do cofre patrimonial, comum a Android e iOS (ADR-002, #180).
 *
 * Quem implementa (`:shared:core:database`, `androidMain`/`iosMain`) decide a engine física
 * (Room+SQLCipher no Android, SQLCipher via cinterop no iOS); nada disso vaza para quem consome
 * este contrato. Nenhum tipo de infraestrutura (entidade Room, `Cursor`, ponteiro `sqlite3*`)
 * atravessa esta fronteira — só [ItemPatrimonial] e os tipos deste arquivo.
 */
interface RepositorioItensPatrimoniais {

    /**
     * Abre o banco físico usando a chave obtida do [ProvedorChaveMestra] configurado na
     * implementação. Chamar `inserir`/`atualizar`/... antes de `abrir` (ou depois de uma falha de
     * abertura) é responsabilidade do chamador evitar — as implementações devem retornar
     * [ErroRepositorio.FalhaAbertura] em vez de lançar exceção não tratada nesse caso.
     *
     * Falha de chave nunca apaga nem recria o banco: retorna [ErroRepositorio.ChaveInvalida] e
     * mantém o arquivo físico intacto para uma tentativa futura (ex.: depois de #118 restaurar o
     * material criptográfico).
     */
    suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio>

    /** Libera a conexão física. Idempotente — chamar em um repositório já fechado não é erro. */
    suspend fun fechar()

    suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio>

    suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio>

    suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio>

    suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio>

    suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio>

    /**
     * Aplica um ajuste manual de valor atomicamente (issue #119): grava o novo `valorCentavos` no
     * item **e** o registro histórico em [AjusteValorItem] na mesma operação — nunca um sem o
     * outro. Implementações fazem isso internamente com a mesma garantia de
     * [executarEmTransacao] (tudo ou nada); o chamador não precisa orquestrar a transação.
     */
    suspend fun registrarAjusteDeValor(
        itemId: String,
        novoValorCentavos: Long,
        dataEpocaMs: Long,
    ): Resultado<ItemPatrimonial, ErroRepositorio>

    /** Histórico de ajustes de um item, do mais antigo para o mais recente. */
    suspend fun listarAjustesDeValor(itemId: String): Resultado<List<AjusteValorItem>, ErroRepositorio>

    /**
     * Registra um evento da linha do tempo básica (issue #120) — sempre chamado por
     * [ServicoPatrimonio] logo após a operação de escrita correspondente já ter sido confirmada
     * (nunca antes, para não registrar evento de algo que falhou em persistir).
     */
    suspend fun registrarEventoTimeline(
        itemId: String,
        itemNome: String,
        tipo: TipoEventoTimeline,
        dataEpocaMs: Long,
    ): Resultado<EventoTimelineItem, ErroRepositorio>

    /**
     * Linha do tempo, mais recente primeiro. `itemId = null` retorna a linha do tempo global
     * (Home); um id específico filtra para a tela de Detalhe do item.
     */
    suspend fun listarTimeline(itemId: String? = null): Resultado<List<EventoTimelineItem>, ErroRepositorio>

    /**
     * Executa [bloco] atomicamente: todas as operações de dentro se aplicam juntas, ou nenhuma se
     * aplica. Uma exceção lançada dentro de [bloco] reverte a transação inteira e vira
     * [ErroRepositorio.FalhaTransacao] — o chamador nunca precisa capturar exceção de engine.
     */
    suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio>
}

/** Escopo restrito de operações permitidas dentro de [RepositorioItensPatrimoniais.executarEmTransacao]. */
interface TransacaoItensPatrimoniais {
    suspend fun inserir(item: ItemPatrimonial)
    suspend fun atualizar(item: ItemPatrimonial)
    suspend fun excluir(id: String)
}
