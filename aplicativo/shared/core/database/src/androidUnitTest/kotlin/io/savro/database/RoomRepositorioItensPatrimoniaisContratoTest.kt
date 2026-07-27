package io.savro.database

import android.content.Context
import androidx.room.RoomDatabase
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.core.app.ApplicationProvider
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import java.util.UUID
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Roda o contrato comum contra Room real (schema, DAO, transação, migration engine), trocando só
 * o `SupportSQLiteOpenHelper.Factory` de SQLCipher pelo framework padrão — Robolectric não
 * consegue carregar `libsqlcipher.so` (biblioteca nativa Android, incompatível com o host JVM do
 * teste). O comportamento específico de SQLCipher (rejeitar senha errada, invalidação de chave)
 * fica em `androidInstrumentedTest`, que exige dispositivo/emulador real — não executado neste
 * ambiente (ver pendências no relatório da #180).
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class RoomRepositorioItensPatrimoniaisContratoTest : RepositorioItensPatrimoniaisContratoTeste() {

    private val arquivosCriados = mutableListOf<String>()
    private val repositoriosCriados = mutableListOf<RepositorioItensPatrimoniaisRoom>()

    override suspend fun criarRepositorio(): RepositorioItensPatrimoniais =
        novoRepositorio(chaveValida = true)

    override suspend fun criarRepositorioComChaveInvalida(): RepositorioItensPatrimoniais =
        novoRepositorio(chaveValida = false)

    override suspend fun encerrar(repositorio: RepositorioItensPatrimoniais) {
        repositorio.fechar()
    }

    private fun novoRepositorio(chaveValida: Boolean): RepositorioItensPatrimoniaisRoom {
        val nomeArquivo = "teste-contrato-${UUID.randomUUID()}.db"
        arquivosCriados += nomeArquivo
        val repositorio = RepositorioItensPatrimoniaisRoom(
            context = contexto(),
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = chaveValida),
            nomeArquivoBanco = nomeArquivo,
            fabricaOpenHelper = { FrameworkSQLiteOpenHelperFactory() },
            // Robolectric não sustenta WAL (ver javadoc de RepositorioItensPatrimoniaisRoom.modoJournal).
            modoJournal = RoomDatabase.JournalMode.TRUNCATE,
        )
        repositoriosCriados += repositorio
        return repositorio
    }

    private fun contexto(): Context = ApplicationProvider.getApplicationContext()

    @After
    fun limparArquivosDeBanco() {
        // Um teste que falha numa asserção nunca chega ao `encerrar()` do fim do método — sem
        // fechar aqui, o banco daquele teste continua aberto (thread/conexão viva) quando o
        // próximo método roda no MESMO processo JVM/sandbox Robolectric.
        repositoriosCriados.forEach { repositorio -> runBlocking { repositorio.fechar() } }
        arquivosCriados.forEach { contexto().deleteDatabase(it) }
    }
}
