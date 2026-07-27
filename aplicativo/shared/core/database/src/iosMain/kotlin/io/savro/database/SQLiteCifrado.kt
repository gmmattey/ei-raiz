package io.savro.database

import cnames.structs.sqlite3
import cocoapods.SQLCipher.sqlite3_changes
import cocoapods.SQLCipher.sqlite3_close
import cocoapods.SQLCipher.sqlite3_errmsg
import cocoapods.SQLCipher.sqlite3_exec
import cocoapods.SQLCipher.sqlite3_key
import cocoapods.SQLCipher.sqlite3_last_insert_rowid
import cocoapods.SQLCipher.sqlite3_open
import kotlinx.cinterop.ByteVar
import kotlinx.cinterop.COpaquePointer
import kotlinx.cinterop.CPointer
import kotlinx.cinterop.CPointerVar
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.StableRef
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.alloc
import kotlinx.cinterop.asStableRef
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.plus
import kotlinx.cinterop.pointed
import kotlinx.cinterop.ptr
import kotlinx.cinterop.staticCFunction
import kotlinx.cinterop.toKString
import kotlinx.cinterop.usePinned
import kotlinx.cinterop.value
import platform.Foundation.NSFileManager
import platform.Foundation.NSSearchPathForDirectoriesInDomains
import platform.Foundation.NSApplicationSupportDirectory
import platform.Foundation.NSUserDomainMask

/**
 * Wrapper mínimo sobre a API C do SQLite/SQLCipher (via cinterop do pod CocoaPods `SQLCipher`,
 * declarado em `build.gradle.kts`). Usa só `sqlite3_exec` (sem `prepare`/`bind`/`step`) para
 * reduzir a superfície de cinterop: os valores são interpolados na string SQL com escaping manual
 * de aspas simples — aceitável aqui porque nenhum valor vem de entrada não confiável (schema
 * fechado, #180 não expõe formulário/import de terceiros ainda).
 *
 * ATENÇÃO (registrado no relatório da #180): não compilado localmente (host Windows sem toolchain
 * iOS). Validação real depende da CI macOS da #195 (`ios-xcode-macos`, que faz o link real do
 * pod). Se a resolução do pod ou a geração de bindings divergir do esperado aqui
 * (`cocoapods.SQLCipher.*`), esta é a primeira coisa a corrigir a partir do log da CI.
 */
@OptIn(ExperimentalForeignApi::class)
internal class SQLiteCifrado private constructor(private val db: CPointer<sqlite3>) {

    fun executar(sql: String) {
        memScoped {
            val erroPonteiro = alloc<CPointerVar<kotlinx.cinterop.ByteVar>>()
            val codigo = sqlite3_exec(db, sql, null, null, erroPonteiro.ptr)
            if (codigo != SQLITE_OK) {
                val mensagem = erroPonteiro.value?.toKString() ?: mensagemDeErro()
                throw SQLiteCifradoException(codigo, mensagem)
            }
        }
    }

    /**
     * `SELECT` via o callback de `sqlite3_exec` — cada linha vira um `Map<coluna, valorTexto>`
     * (NULL vira ausência de chave). Repassa estado para o callback C (que não pode capturar
     * closures Kotlin) via [StableRef] no parâmetro `void*` — padrão usual de cinterop K/N para
     * callbacks C, liberado (`dispose`) no `finally`.
     */
    fun consultar(sql: String): List<Map<String, String?>> {
        val linhas = mutableListOf<Map<String, String?>>()
        val referenciaEstavel = StableRef.create(linhas)
        try {
            memScoped {
                val erroPonteiro = alloc<CPointerVar<ByteVar>>()
                val codigo = sqlite3_exec(
                    db,
                    sql,
                    staticCFunction(::callbackDeLinha),
                    referenciaEstavel.asCPointer(),
                    erroPonteiro.ptr,
                )
                if (codigo != SQLITE_OK) {
                    val mensagem = erroPonteiro.value?.toKString() ?: mensagemDeErro()
                    throw SQLiteCifradoException(codigo, mensagem)
                }
            }
        } finally {
            referenciaEstavel.dispose()
        }
        return linhas
    }

    fun linhasAfetadas(): Int = sqlite3_changes(db)

    fun ultimoIdInserido(): Long = sqlite3_last_insert_rowid(db)

    fun mensagemDeErro(): String = sqlite3_errmsg(db)?.toKString() ?: "erro desconhecido do SQLite"

    fun fechar() {
        sqlite3_close(db)
    }

    companion object {
        const val SQLITE_OK = 0
        const val SQLITE_CANTOPEN = 14
        const val SQLITE_NOTADB = 26

        /**
         * Abre (ou cria) o banco em `caminho` e aplica a chave SQLCipher antes de qualquer outra
         * operação — mesma ordem exigida pela API do SQLCipher em qualquer plataforma.
         * `sqlite3_open` sozinho não valida a chave; só a primeira operação real (aqui, o
         * `PRAGMA user_version` de [SQLiteCifrado.executar] chamado por quem constrói o schema)
         * revela chave errada, igual ao comportamento documentado em 117-A para o Android.
         */
        fun abrir(caminho: String, chave: ByteArray): SQLiteCifrado = memScoped {
            val dbPonteiro = alloc<CPointerVar<sqlite3>>()
            val codigoAbertura = sqlite3_open(caminho, dbPonteiro.ptr)
            val ponteiro = dbPonteiro.value
            if (codigoAbertura != SQLITE_OK || ponteiro == null) {
                ponteiro?.let { sqlite3_close(it) }
                throw SQLiteCifradoException(codigoAbertura, "sqlite3_open falhou para '$caminho'")
            }

            val codigoChave = chave.usePinned { pinada ->
                sqlite3_key(ponteiro, pinada.addressOf(0), chave.size)
            }
            if (codigoChave != SQLITE_OK) {
                sqlite3_close(ponteiro)
                throw SQLiteCifradoException(codigoChave, "sqlite3_key falhou")
            }

            SQLiteCifrado(ponteiro)
        }

        /** Diretório de suporte do app (`Application Support/savro/`) — fora de qualquer bundle de backup automático não intencional. */
        fun caminhoPadrao(nomeArquivo: String): String {
            val diretorios = NSSearchPathForDirectoriesInDomains(
                NSApplicationSupportDirectory,
                NSUserDomainMask,
                true,
            )
            val gerenciadorDeArquivos = NSFileManager.defaultManager()
            val base = (diretorios.firstOrNull() as? String) ?: gerenciadorDeArquivos.currentDirectoryPath
            val diretorioSavro = "$base/savro"
            runCatching {
                gerenciadorDeArquivos.createDirectoryAtPath(
                    diretorioSavro,
                    withIntermediateDirectories = true,
                    attributes = null,
                    error = null,
                )
            }
            return "$diretorioSavro/$nomeArquivo"
        }
    }
}

internal class SQLiteCifradoException(val codigo: Int, mensagem: String) : Exception(mensagem)

/**
 * Callback C de `sqlite3_exec` — precisa ser função de nível de topo (sem closure capturada) para
 * virar `staticCFunction`. O estado real (lista de linhas) chega via `dados`, um [StableRef]
 * repassado como `void*` em [SQLiteCifrado.consultar].
 */
@OptIn(ExperimentalForeignApi::class)
private fun callbackDeLinha(
    dados: COpaquePointer?,
    numeroDeColunas: Int,
    valores: CPointer<CPointerVar<ByteVar>>?,
    nomesDasColunas: CPointer<CPointerVar<ByteVar>>?,
): Int {
    val linhas = dados?.asStableRef<MutableList<Map<String, String?>>>()?.get() ?: return 0
    val linha = mutableMapOf<String, String?>()
    for (indice in 0 until numeroDeColunas) {
        val nomeColuna = nomesDasColunas?.plus(indice)?.pointed?.value?.toKString() ?: continue
        linha[nomeColuna] = valores?.plus(indice)?.pointed?.value?.toKString()
    }
    linhas.add(linha)
    return 0
}
