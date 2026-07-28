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

/** Schema exato da versão 2 (pós #180, pré #119) — usado para testar a migration 2->3. */
@Entity(tableName = "itens_patrimoniais")
internal data class EntidadeItemPatrimonialV2(
    @PrimaryKey val id: String,
    val tipo: String,
    val nome: String,
    @ColumnInfo(name = "valor_centavos") val valorCentavos: Long,
    val instituicao: String?,
    val observacao: String?,
    @ColumnInfo(name = "criado_em_epoca_ms") val criadoEmEpocaMs: Long,
    @ColumnInfo(name = "atualizado_em_epoca_ms") val atualizadoEmEpocaMs: Long,
)

@Dao
internal interface DaoItemPatrimonialV2 {
    @Insert
    suspend fun inserir(entidade: EntidadeItemPatrimonialV2)
}

@Database(entities = [EntidadeItemPatrimonialV2::class], version = 2, exportSchema = false)
internal abstract class SavroRoomDatabaseV2SomenteParaTeste : RoomDatabase() {
    abstract fun dao(): DaoItemPatrimonialV2
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

    @Test
    fun migracao2Para3_remapeiaTiposPreservaDadosEAdicionaCamposDoCadastroManual() = runTest {
        val arquivo = "teste-migracao-${UUID.randomUUID()}.db"
        nomeArquivo = arquivo
        val contexto = contexto()

        val bancoV2 = Room.databaseBuilder(contexto, SavroRoomDatabaseV2SomenteParaTeste::class.java, arquivo)
            .openHelperFactory(FrameworkSQLiteOpenHelperFactory())
            .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
            .build()
        bancoV2.dao().inserir(
            EntidadeItemPatrimonialV2(
                id = "item-investimento",
                tipo = "INVESTIMENTO",
                nome = "Ações XPTO",
                valorCentavos = 50_000,
                instituicao = "Corretora Teste",
                observacao = null,
                criadoEmEpocaMs = 1,
                atualizadoEmEpocaMs = 1,
            ),
        )
        bancoV2.dao().inserir(
            EntidadeItemPatrimonialV2(
                id = "item-imovel",
                tipo = "IMOVEL",
                nome = "Apartamento",
                valorCentavos = 30_000_000,
                instituicao = null,
                observacao = "Comprado em 2020",
                criadoEmEpocaMs = 2,
                atualizadoEmEpocaMs = 2,
            ),
        )
        bancoV2.close()

        val bancoV3 = Room.databaseBuilder(contexto, SavroRoomDatabase::class.java, arquivo)
            .openHelperFactory(FrameworkSQLiteOpenHelperFactory())
            .addMigrations(*TODAS_AS_MIGRATIONS_ROOM)
            .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
            .build()

        val investimentoMigrado = bancoV3.itemPatrimonialDao().buscarPorId("item-investimento")
        assertEquals("RENDA_VARIAVEL", investimentoMigrado?.tipo)
        assertEquals("Ações XPTO", investimentoMigrado?.nome)
        assertEquals(50_000L, investimentoMigrado?.valorCentavos)
        assertEquals("BRL", investimentoMigrado?.moeda)
        assertEquals("MANUAL", investimentoMigrado?.origem)
        assertEquals(false, investimentoMigrado?.arquivado)
        assertNull(investimentoMigrado?.quantidadeMilesimos)

        val imovelMigrado = bancoV3.itemPatrimonialDao().buscarPorId("item-imovel")
        assertEquals("BEM", imovelMigrado?.tipo)
        assertEquals("Comprado em 2020", imovelMigrado?.observacao)

        bancoV3.close()
    }

    @Test
    fun migracao3Para4_criaTabelaDeTimelineSemPerderItensExistentes() = runTest {
        val arquivo = "teste-migracao-${UUID.randomUUID()}.db"
        nomeArquivo = arquivo
        val contexto = contexto()

        // Reaproveita o schema real da v3 (SavroRoomDatabase já compilado com a entidade nova
        // não serviria — precisamos do schema tal como estava antes da #120). Como a v3 já é
        // idêntica ao schema de itens_patrimoniais pós #119, criamos direto via SQL bruto na v2
        // + migration 2->3 para chegar num banco v3 realista antes de aplicar a 3->4.
        val bancoV2 = Room.databaseBuilder(contexto, SavroRoomDatabaseV2SomenteParaTeste::class.java, arquivo)
            .openHelperFactory(FrameworkSQLiteOpenHelperFactory())
            .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
            .build()
        bancoV2.dao().inserir(
            EntidadeItemPatrimonialV2(
                id = "item-1",
                tipo = "CONTA",
                nome = "Conta corrente",
                valorCentavos = 1_000,
                instituicao = null,
                observacao = null,
                criadoEmEpocaMs = 1,
                atualizadoEmEpocaMs = 1,
            ),
        )
        bancoV2.close()

        val bancoV4 = Room.databaseBuilder(contexto, SavroRoomDatabase::class.java, arquivo)
            .openHelperFactory(FrameworkSQLiteOpenHelperFactory())
            .addMigrations(*TODAS_AS_MIGRATIONS_ROOM)
            .setJournalMode(RoomDatabase.JournalMode.TRUNCATE)
            .build()

        val itemMigrado = bancoV4.itemPatrimonialDao().buscarPorId("item-1")
        assertEquals("Conta corrente", itemMigrado?.nome)

        bancoV4.itemPatrimonialDao().inserirEventoTimeline(
            EntidadeEventoTimelineItem(
                id = "evento-1",
                itemId = "item-1",
                itemNome = "Conta corrente",
                tipo = "ITEM_CRIADO",
                dataEpocaMs = 2,
            ),
        )
        val timeline = bancoV4.itemPatrimonialDao().listarTimelineDoItem("item-1")
        assertEquals(1, timeline.size)
        assertEquals("ITEM_CRIADO", timeline.single().tipo)

        bancoV4.close()
    }

    private fun contexto(): Context = ApplicationProvider.getApplicationContext()

    @After
    fun limpar() {
        nomeArquivo?.let { contexto().deleteDatabase(it) }
    }
}
