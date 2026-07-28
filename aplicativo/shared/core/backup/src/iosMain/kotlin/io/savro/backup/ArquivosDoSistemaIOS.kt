package io.savro.backup

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import kotlinx.coroutines.CompletableDeferred
import platform.Foundation.NSData
import platform.Foundation.NSFileManager
import platform.Foundation.NSTemporaryDirectory
import platform.Foundation.NSURL
import platform.Foundation.create
import platform.Foundation.dataWithContentsOfURL
import platform.Foundation.writeToFile
import platform.UIKit.UIApplication
import platform.UIKit.UIDocumentPickerDelegateProtocol
import platform.UIKit.UIDocumentPickerViewController
import platform.UniformTypeIdentifiers.UTType
import platform.UniformTypeIdentifiers.UTTypeCommaSeparatedText
import platform.UniformTypeIdentifiers.UTTypeData
import platform.darwin.NSObject

/**
 * `UIDocumentPickerViewController` (#121): exportação com `forExportingURLs` (o sistema copia o
 * arquivo para onde o usuário escolher — Arquivos, iCloud Drive do próprio usuário, outro app) e
 * restauração com `forOpeningContentTypes`. O Savro não escreve fora do próprio sandbox e nunca
 * envia nada por rede.
 *
 * O delegate é retido em [delegateAtivo] enquanto o seletor está na tela: `UIDocumentPicker`
 * guarda o delegate como referência fraca, e sem isso ele seria coletado antes do callback.
 */
@OptIn(ExperimentalForeignApi::class)
class ArquivosDoSistemaIOS : ArquivosDoSistema {

    private var delegateAtivo: NSObject? = null

    override suspend fun salvar(caminhoTemporario: String, nomeSugerido: String, tipoMime: String): Boolean {
        val url = NSURL.fileURLWithPath(caminhoTemporario)
        val aguardando = CompletableDeferred<Boolean>()
        val seletor = UIDocumentPickerViewController(forExportingURLs = listOf(url))
        apresentar(seletor, aguardando) { urls -> urls.isNotEmpty() }
        return aguardando.await()
    }

    override suspend fun selecionar(tipoMime: String, extensao: String): ByteArray? {
        val tipos = listOfNotNull(
            UTType.typeWithFilenameExtension(extensao),
            if (tipoMime == ExportadorCsv.TIPO_MIME) UTTypeCommaSeparatedText else UTTypeData,
        )
        val aguardando = CompletableDeferred<ByteArray?>()
        val seletor = UIDocumentPickerViewController(forOpeningContentTypes = tipos)
        apresentar(seletor, aguardando) { urls -> urls.firstOrNull()?.let(::lerConteudo) }
        return aguardando.await()
    }

    private fun <T> apresentar(
        seletor: UIDocumentPickerViewController,
        aguardando: CompletableDeferred<T>,
        aoEscolher: (List<NSURL>) -> T,
    ) {
        val delegate = object : NSObject(), UIDocumentPickerDelegateProtocol {
            override fun documentPicker(
                controller: UIDocumentPickerViewController,
                didPickDocumentsAtURLs: List<*>,
            ) {
                val urls = didPickDocumentsAtURLs.filterIsInstance<NSURL>()
                aguardando.complete(aoEscolher(urls))
                delegateAtivo = null
            }

            override fun documentPickerWasCancelled(controller: UIDocumentPickerViewController) {
                aguardando.complete(aoEscolher(emptyList()))
                delegateAtivo = null
            }
        }
        delegateAtivo = delegate
        seletor.delegate = delegate

        val raiz = UIApplication.sharedApplication.keyWindow?.rootViewController
        if (raiz == null) {
            delegateAtivo = null
            aguardando.complete(aoEscolher(emptyList()))
            return
        }
        raiz.presentViewController(seletor, animated = true, completion = null)
    }

    /**
     * Arquivo escolhido no seletor vem com escopo de segurança: sem
     * `startAccessingSecurityScopedResource`, a leitura falha silenciosamente para arquivos fora
     * do sandbox do app.
     */
    private fun lerConteudo(url: NSURL): ByteArray? {
        val acessou = url.startAccessingSecurityScopedResource()
        return try {
            NSData.dataWithContentsOfURL(url)?.paraByteArray()
        } finally {
            if (acessou) url.stopAccessingSecurityScopedResource()
        }
    }
}

/** `NSTemporaryDirectory()/savro-backup` — sandbox do app, limpo pelo sistema e por nós. */
class AreaTemporariaBackupIOS : AreaTemporariaBackup {

    private val diretorio = NSTemporaryDirectory() + "savro-backup"

    override suspend fun gravar(nome: String, conteudo: ByteArray): String {
        NSFileManager.defaultManager().createDirectoryAtPath(
            diretorio,
            withIntermediateDirectories = true,
            attributes = null,
            error = null,
        )
        val caminho = "$diretorio/$nome"
        check(conteudo.paraNsData().writeToFile(caminho, atomically = true)) {
            "Falha ao gravar temporário"
        }
        return caminho
    }

    override suspend fun remover(caminho: String) {
        NSFileManager.defaultManager().removeItemAtPath(caminho, error = null)
    }
}

@OptIn(ExperimentalForeignApi::class)
private fun NSData.paraByteArray(): ByteArray {
    val tamanho = length.toInt()
    val destino = ByteArray(tamanho)
    if (tamanho > 0) {
        destino.usePinned { fixado ->
            platform.posix.memcpy(fixado.addressOf(0), bytes, length)
        }
    }
    return destino
}

@OptIn(ExperimentalForeignApi::class)
private fun ByteArray.paraNsData(): NSData {
    // `usePinned` em array vazio lança IllegalArgumentException — backup vazio é caso de teste
    // obrigatório da #121, então este caminho existe de verdade.
    if (isEmpty()) return NSData()
    return usePinned { fixado -> NSData.create(bytes = fixado.addressOf(0), length = size.toULong()) }
}
