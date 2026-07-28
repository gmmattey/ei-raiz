package io.savro.backup

import android.content.Context
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import java.io.File
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Storage Access Framework (#121): `ACTION_CREATE_DOCUMENT` para salvar e `ACTION_OPEN_DOCUMENT`
 * para restaurar. O app não pede nenhuma permissão de armazenamento e não escreve fora do próprio
 * cache — quem escolhe o destino é o usuário, no seletor do sistema.
 *
 * Os launchers são registrados no `onCreate` da Activity (junto com a composição do cofre), como
 * o `ActivityResultRegistry` exige. Limitação conhecida, herdada de `ComposicaoCofreAndroid`: uma
 * recriação de Activity no meio do seletor perde a operação em curso; o app é portrait único e o
 * usuário simplesmente repete a ação.
 */
class ArquivosDoSistemaAndroid(activity: ComponentActivity) : ArquivosDoSistema {

    private val contexto: Context = activity.applicationContext

    private var aguardandoSalvar: CompletableDeferred<Uri?>? = null
    private var aguardandoSelecionar: CompletableDeferred<Uri?>? = null

    private val criarDocumento: ActivityResultLauncher<String> =
        activity.registerForActivityResult(CriarDocumentoBinario()) { destino ->
            aguardandoSalvar?.complete(destino)
            aguardandoSalvar = null
        }

    private val abrirDocumento: ActivityResultLauncher<Array<String>> =
        activity.registerForActivityResult(ActivityResultContracts.OpenDocument()) { origem ->
            aguardandoSelecionar?.complete(origem)
            aguardandoSelecionar = null
        }

    override suspend fun salvar(caminhoTemporario: String, nomeSugerido: String, tipoMime: String): Boolean {
        val aguardando = CompletableDeferred<Uri?>()
        aguardandoSalvar = aguardando
        criarDocumento.launch(nomeSugerido)
        val destino = aguardando.await() ?: return false

        withContext(Dispatchers.IO) {
            val origem = File(caminhoTemporario)
            contexto.contentResolver.openOutputStream(destino)?.use { saida ->
                origem.inputStream().use { entrada -> entrada.copyTo(saida) }
            } ?: error("Não foi possível abrir o destino escolhido")
        }
        return true
    }

    override suspend fun selecionar(tipoMime: String, extensao: String): ByteArray? {
        val aguardando = CompletableDeferred<Uri?>()
        aguardandoSelecionar = aguardando
        // `*/*`: muitos provedores de arquivo do Android não associam a extensão `.savrobackup` a
        // nenhum MIME conhecido, e filtrar por `application/octet-stream` esconderia o arquivo do
        // próprio usuário. A validação real é do cabeçalho, não da extensão.
        abrirDocumento.launch(arrayOf("*/*"))
        val origem = aguardando.await() ?: return null

        return withContext(Dispatchers.IO) {
            contexto.contentResolver.openInputStream(origem)?.use { it.readBytes() }
        }
    }

    /**
     * `ActivityResultContracts.CreateDocument` exige o MIME no construtor; aqui ele é fixo porque
     * tanto o `*.savrobackup` quanto o CSV são gravados como fluxo binário — o nome sugerido é que
     * carrega a extensão correta para o seletor.
     */
    private class CriarDocumentoBinario : ActivityResultContracts.CreateDocument("application/octet-stream")
}

/** Cache privado do app (`cacheDir/backup`), nunca visível para outros apps nem para o usuário. */
class AreaTemporariaBackupAndroid(contexto: Context) : AreaTemporariaBackup {

    private val diretorio = File(contexto.cacheDir, "backup")

    override suspend fun gravar(nome: String, conteudo: ByteArray): String = withContext(Dispatchers.IO) {
        diretorio.mkdirs()
        val arquivo = File(diretorio, nome)
        arquivo.writeBytes(conteudo)
        arquivo.absolutePath
    }

    override suspend fun remover(caminho: String) {
        withContext(Dispatchers.IO) { File(caminho).delete() }
    }
}
