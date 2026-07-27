package io.savro.database

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.withTransaction
import androidx.sqlite.db.SupportSQLiteOpenHelper
import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.ProvedorChaveMestra
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.domain.patrimonio.TransacaoItensPatrimoniais
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
import java.util.Arrays
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import net.zetetic.database.sqlcipher.SupportOpenHelperFactory

/**
 * Implementação Android de [RepositorioItensPatrimoniais]: Room 2.8.4 sobre SQLCipher
 * (`net.zetetic:sqlcipher-android:4.17.0`, via `SupportOpenHelperFactory`), conforme baseline
 * aprovado em 117-A (#176) e a decisão da #180 (ver
 * `documentacao/arquitetura/validacoes/117-O-decisao-persistencia-180.md`).
 *
 * [fabricaOpenHelper] existe para permitir que o teste de contrato comum
 * (`RoomRepositorioItensPatrimoniaisContratoTest`, Robolectric) troque o SQLCipher real por
 * `FrameworkSQLiteOpenHelperFactory` — Robolectric não carrega `libsqlcipher.so` (biblioteca
 * nativa compilada para ABI Android, incompatível com o host JVM dos testes). Produção nunca
 * troca isso; só o teste. O comportamento específico de SQLCipher (rejeitar chave errada,
 * `KeyPermanentlyInvalidatedException`) é validado à parte, em `androidInstrumentedTest` — exige
 * dispositivo/emulador real, fora do que este ambiente consegue executar (ver relatório da #180).
 *
 * [modoJournal] segue `null` em produção (Room usa WAL por padrão, melhor para acesso
 * concorrente em dispositivo real). O teste de contrato força `JournalMode.TRUNCATE`: o runtime
 * nativo de SQLite do Robolectric (`org.robolectric.nativeruntime.SQLiteConnectionNatives`) falha
 * com `SQLITE_CANTOPEN` ao tentar `PRAGMA journal_mode=WAL` — WAL exige criar arquivos `-wal`/
 * `-shm` adicionais ao lado do banco, e esse caminho não é totalmente suportado nesse runtime.
 * Isso não é um problema do Savro nem do dispositivo real, é uma limitação documentada de rodar
 * Room sob Robolectric.
 */
class RepositorioItensPatrimoniaisRoom(
    private val context: Context,
    private val provedorChaveMestra: ProvedorChaveMestra,
    private val nomeArquivoBanco: String = EsquemaSavro.NOME_BANCO,
    private val relogio: Relogio = RelogioDoSistemaAndroid,
    private val fabricaOpenHelper: (chave: ByteArray) -> SupportSQLiteOpenHelper.Factory =
        { chave -> SupportOpenHelperFactory(chave) },
    private val modoJournal: RoomDatabase.JournalMode? = null,
) : RepositorioItensPatrimoniais {

    private val mutex = Mutex()

    // As operações de CRUD leem este campo sem passar pelo mutex (só abrir()/fechar() escrevem sob
    // lock); @Volatile garante visibilidade da escrita entre threads.
    @Volatile
    private var banco: SavroRoomDatabase? = null

    override suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio> = mutex.withLock {
        banco?.let {
            return@withLock Resultado.Sucesso(MetadadosBancoLocal(EsquemaSavro.VERSAO_ATUAL, it.itemPatrimonialDao().contar()))
        }

        when (val resultadoChave = provedorChaveMestra.obterOuCriarChave()) {
            is Resultado.Falha -> Resultado.Falha(resultadoChave.erro)
            is Resultado.Sucesso -> abrirComChave(resultadoChave.valor)
        }
    }

    private suspend fun abrirComChave(chave: ByteArray): Resultado<MetadadosBancoLocal, ErroRepositorio> = try {
        // SQLITE_CANTOPEN se o diretório "databases/" ainda não existir (primeira execução em
        // alguns ambientes/dispositivos, ou sandbox de teste recém-criado) — Room não garante essa
        // criação sozinho.
        context.getDatabasePath(nomeArquivoBanco).parentFile?.mkdirs()
        val construtor = Room.databaseBuilder(context, SavroRoomDatabase::class.java, nomeArquivoBanco)
            .openHelperFactory(fabricaOpenHelper(chave))
            .addMigrations(*TODAS_AS_MIGRATIONS_ROOM)
        modoJournal?.let { construtor.setJournalMode(it) }
        val instancia = construtor.build()
        // Room constrói de forma preguiçosa: força a abertura física agora para detectar chave
        // errada ou arquivo corrompido já em abrir(), não silenciosamente na primeira operação.
        val total = instancia.itemPatrimonialDao().contar()
        banco = instancia
        Resultado.Sucesso(MetadadosBancoLocal(EsquemaSavro.VERSAO_ATUAL, total))
    } catch (excecao: Exception) {
        mapearExcecaoDeAbertura(excecao)
    } finally {
        Arrays.fill(chave, 0)
    }

    override suspend fun fechar() {
        mutex.withLock {
            banco?.close()
            banco = null
        }
    }

    override suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        comBancoAberto { dao ->
            val agora = relogio.agoraEmEpocaMs()
            val itemComTimestamps = item.copy(criadoEmEpocaMs = agora, atualizadoEmEpocaMs = agora)
            dao.inserir(itemComTimestamps.paraEntidade())
            Resultado.Sucesso(itemComTimestamps)
        }

    override suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        comBancoAberto { dao ->
            val itemAtualizado = item.copy(atualizadoEmEpocaMs = relogio.agoraEmEpocaMs())
            val linhasAfetadas = dao.atualizar(itemAtualizado.paraEntidade())
            if (linhasAfetadas == 0) {
                Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(item.id))
            } else {
                Resultado.Sucesso(itemAtualizado)
            }
        }

    override suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio> = comBancoAberto { dao ->
        val linhasAfetadas = dao.excluir(id)
        if (linhasAfetadas == 0) {
            Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(id))
        } else {
            Resultado.Sucesso(Unit)
        }
    }

    override suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio> =
        comBancoAberto { dao -> Resultado.Sucesso(dao.buscarPorId(id)?.paraModelo()) }

    override suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio> =
        comBancoAberto { dao -> Resultado.Sucesso(dao.listarTodos().map { it.paraModelo() }) }

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> {
        val instancia = banco ?: return Resultado.Falha(
            ErroRepositorio.FalhaAbertura("Repositório chamado antes de abrir()"),
        )
        return try {
            instancia.withTransaction {
                TransacaoItensPatrimoniaisRoom(instancia.itemPatrimonialDao(), relogio).bloco()
            }
            Resultado.Sucesso(Unit)
        } catch (excecao: Exception) {
            Resultado.Falha(ErroRepositorio.FalhaTransacao(excecao.message ?: "Transação revertida"))
        }
    }

    private suspend fun <T> comBancoAberto(
        operacao: suspend (ItemPatrimonialDao) -> Resultado<T, ErroRepositorio>,
    ): Resultado<T, ErroRepositorio> {
        val instancia = banco ?: return Resultado.Falha(
            ErroRepositorio.FalhaAbertura("Repositório chamado antes de abrir()"),
        )
        return operacao(instancia.itemPatrimonialDao())
    }

    /**
     * SQLCipher/SQLite não distinguem "chave errada" de "arquivo corrompido" por código de erro —
     * o sintoma é o mesmo: o cabeçalho não decifra para um SQLite válido. A mensagem real do
     * SQLCipher é `"file is encrypted or is not a database"`; qualquer outra falha vira
     * [ErroRepositorio.FalhaAbertura].
     */
    private fun mapearExcecaoDeAbertura(excecao: Exception): Resultado<MetadadosBancoLocal, ErroRepositorio> {
        val mensagem = excecao.message?.lowercase().orEmpty()
        return if ("encrypted" in mensagem || "not a database" in mensagem) {
            Resultado.Falha(ErroRepositorio.ChaveInvalida("Chave incorreta ou arquivo corrompido"))
        } else {
            Resultado.Falha(ErroRepositorio.FalhaAbertura(excecao.message ?: excecao.javaClass.simpleName))
        }
    }

    private class TransacaoItensPatrimoniaisRoom(
        private val dao: ItemPatrimonialDao,
        private val relogio: Relogio,
    ) : TransacaoItensPatrimoniais {
        override suspend fun inserir(item: ItemPatrimonial) {
            val agora = relogio.agoraEmEpocaMs()
            dao.inserir(item.copy(criadoEmEpocaMs = agora, atualizadoEmEpocaMs = agora).paraEntidade())
        }

        override suspend fun atualizar(item: ItemPatrimonial) {
            val itemAtualizado = item.copy(atualizadoEmEpocaMs = relogio.agoraEmEpocaMs())
            check(dao.atualizar(itemAtualizado.paraEntidade()) > 0) { "Item '${item.id}' não encontrado na transação" }
        }

        override suspend fun excluir(id: String) {
            check(dao.excluir(id) > 0) { "Item '$id' não encontrado na transação" }
        }
    }
}
