package io.savro.database

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.domain.patrimonio.TransacaoItensPatrimoniais
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
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

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> = mutex.withLock {
        exigirAberto()?.let { return@withLock Resultado.Falha(it) }
        val instantaneo = LinkedHashMap(itens)
        val transacao = TransacaoEmMemoria(itens, relogio)
        return@withLock try {
            transacao.bloco()
            Resultado.Sucesso(Unit)
        } catch (excecao: Exception) {
            itens.clear()
            itens.putAll(instantaneo)
            Resultado.Falha(ErroRepositorio.FalhaTransacao(excecao.message ?: "Transação revertida"))
        }
    }

    private fun exigirAberto(): ErroRepositorio? =
        if (!aberto) ErroRepositorio.FalhaAbertura("Repositório chamado antes de abrir()") else null

    private class TransacaoEmMemoria(
        private val itens: MutableMap<String, ItemPatrimonial>,
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
        }
    }
}
