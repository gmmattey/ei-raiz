package io.savro.database

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import java.util.UUID
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.runner.RunWith

/**
 * Roda o mesmo contrato comum (`RepositorioItensPatrimoniaisContratoTeste`, `commonTest`) contra a
 * engine REAL de produção: Room 2.8.4 + `net.zetetic:sqlcipher-android` via
 * `SupportOpenHelperFactory` — a fábrica *padrão* de [RepositorioItensPatrimoniaisRoom], sem trocar
 * por `FrameworkSQLiteOpenHelperFactory` como faz `RoomRepositorioItensPatrimoniaisContratoTest`
 * (Robolectric).
 *
 * Só roda em device/emulador real (`:shared:core:database:connectedDebugAndroidTest`) —
 * Robolectric não carrega `libsqlcipher.so` (biblioteca nativa Android). Antes da #247 esse
 * caminho nunca tinha teste real: o comentário em [RepositorioItensPatrimoniaisRoom] prometia
 * "validado à parte, em androidInstrumentedTest", mas o source set não existia. Sem isso, o
 * `UnsatisfiedLinkError` em `net.zetetic.database.sqlcipher.SQLiteConnection.nativeOpen` (causado
 * pela ausência de `System.loadLibrary("sqlcipher")`) só era descoberto em produção — nenhum teste
 * automatizado exercitava a abertura real do cofre cifrado.
 */
@RunWith(AndroidJUnit4::class)
class RoomSQLCipherRepositorioItensPatrimoniaisInstrumentedTest : RepositorioItensPatrimoniaisContratoTeste() {

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
        val nomeArquivo = "teste-instrumentado-sqlcipher-${UUID.randomUUID()}.db"
        arquivosCriados += nomeArquivo
        // Nenhum `fabricaOpenHelper`/`modoJournal` sobrescrito: usa exatamente a config de
        // produção (SQLCipher real via `SupportOpenHelperFactory` + WAL), o inverso do que o teste
        // Robolectric faz de propósito para contornar a limitação do runtime JVM.
        val repositorio = RepositorioItensPatrimoniaisRoom(
            context = contexto(),
            provedorChaveMestra = FakeProvedorChaveMestra(chaveValidaSimulada = chaveValida),
            nomeArquivoBanco = nomeArquivo,
        )
        repositoriosCriados += repositorio
        return repositorio
    }

    private fun contexto(): Context = ApplicationProvider.getApplicationContext()

    @After
    fun limparArquivosDeBanco() {
        // Mesmo racional do teste Robolectric: um teste que falha numa asserção não chega ao
        // `encerrar()` do fim do método — sem fechar aqui, o banco daquele teste continua aberto
        // quando o próximo método roda na mesma instrumentação.
        repositoriosCriados.forEach { repositorio -> runBlocking { repositorio.fechar() } }
        arquivosCriados.forEach { contexto().deleteDatabase(it) }
    }
}
