package io.savro.database

import android.content.Context
import androidx.room.ColumnInfo
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.core.app.ApplicationProvider
import java.util.UUID
import kotlinx.coroutines.test.runTest
import kotlin.test.assertEquals
import kotlin.test.assertNull
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Entidade/DAO/banco que existem só neste arquivo de teste, reproduzindo o schema exato da versão
 * 1 (antes de `observacao` existir). O projeto ainda não tinha uma versão publicada — não há
 * histórico real de schema exportado para `MigrationTestHelper` consumir — então o teste cria
 * fisicamente um banco v1 usando o próprio Room (garantindo schema correto), fecha, e reabre o
 * mesmo arquivo com [SavroRoomDatabase] real e a migration real de produção
 * ([TODAS_AS_MIGRATIONS_ROOM]). Isso valida a migration de verdade, não uma simulação.
 */
@Entity(tableName = "itens_patrimoniais")
internal data class EntidadeItemPatrimonialV1(
    @PrimaryKey val id: String,
    val tipo: String,
    val nome: String,
    @ColumnInfo(name = "valor_centavos") val valorCentavos: Long,
    val instituicao: String?,
    @ColumnInfo(name = "criado_em_epoca_ms") val criadoEmEpocaMs: Long,
    @ColumnInfo(name = "atualizado_em_epoca_ms") val atualizadoEmEpocaMs: Long,
)

@Dao
internal interface DaoItemPatrimonialV1 {
    @Insert
    suspend fun inserir(entidade: EntidadeItemPatrimonialV1)
}

@Database(entities = [EntidadeItemPatrimonialV1::class], version = 1, exportSchema = false)
internal abstract class SavroRoomDatabaseV1SomenteParaTeste : RoomDatabase() {
    abstract fun dao(): DaoItemPatrimonialV1
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class RoomMigrationTest {

    private var nomeArquivo: String? = null

    @Test
    fun migracao1Para2_preservaDadosEAdicionaColunaObservacaoComoNula() = runTest {
        val arquivo = "teste-migracao-${UUID.randomUUID()}.db"
        nomeArquivo = arquivo
        val contexto = contexto()

        // TRUNCATE em vez do WAL padrão do Room: o runtime nativo de SQLite do Robolectric não
        // sustenta WAL de forma confiável (ver javadoc de RepositorioItensPatrimoniaisRoom.modoJournal).
        val bancoV1 = Room.databaseBuilder(contexto, SavroRoomDatabaseV1SomenteParaTeste::class.java, arquivo)
            .openHelperFactory(FrameworkSQLiteOpenHelperFactory())
            .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
            .build()
        bancoV1.dao().inserir(
            EntidadeItemPatrimonialV1(
                id = "item-1",
                tipo = "CONTA",
                nome = "Conta corrente",
                valorCentavos = 1_000,
                instituicao = "Banco Teste",
                criadoEmEpocaMs = 1,
                atualizadoEmEpocaMs = 1,
            ),
        )
        bancoV1.close()

        val bancoV2 = Room.databaseBuilder(contexto, SavroRoomDatabase::class.java, arquivo)
            .openHelperFactory(FrameworkSQLiteOpenHelperFactory())
            .addMigrations(*TODAS_AS_MIGRATIONS_ROOM)
            .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
            .build()

        val itemMigrado = bancoV2.itemPatrimonialDao().buscarPorId("item-1")
        assertEquals("Conta corrente", itemMigrado?.nome)
        assertEquals(1_000L, itemMigrado?.valorCentavos)
        assertNull(itemMigrado?.observacao)

        bancoV2.itemPatrimonialDao().atualizar(itemMigrado!!.copy(observacao = "Nota adicionada após migration"))
        val itemAtualizado = bancoV2.itemPatrimonialDao().buscarPorId("item-1")
        assertEquals("Nota adicionada após migration", itemAtualizado?.observacao)

        bancoV2.close()
    }

    private fun contexto(): Context = ApplicationProvider.getApplicationContext()

    @After
    fun limpar() {
        nomeArquivo?.let { contexto().deleteDatabase(it) }
    }
}
