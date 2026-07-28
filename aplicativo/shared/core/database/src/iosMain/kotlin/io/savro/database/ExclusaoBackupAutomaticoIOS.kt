package io.savro.database

import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSFileManager
import platform.Foundation.NSURL
import platform.Foundation.NSURLIsExcludedFromBackupKey

/**
 * Resultado de uma tentativa de excluir um arquivo do backup automático do sistema (iCloud/iTunes)
 * — correção obrigatória decidida pelo Luiz sobre o achado da auditoria #130: `savro.db` não tinha
 * exclusão explícita de backup automático no iOS (a chave mestra, no Keychain com
 * `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, já estava corretamente excluída — só o arquivo de
 * banco em si não).
 *
 * [indice] identifica qual candidato de [candidatosDeSidecarDoBanco] foi tentado (0 = banco
 * principal, 1..N = sidecars, na mesma ordem) — nunca o caminho do arquivo, para não revelar nada
 * numa mensagem de log/erro futura (ver `contrato-redaction-savro.md`).
 */
internal sealed class ResultadoExclusaoBackupAutomatico {
    data object Excluido : ResultadoExclusaoBackupAutomatico()

    /** Sidecar transitório (ex.: `-journal`, só existe durante uma transação em andamento). */
    data object ArquivoInexistente : ResultadoExclusaoBackupAutomatico()

    /**
     * `setResourceValue` retornou falso (raro). Mensagem redigida por construção: nunca inclui o
     * caminho do arquivo nem dado patrimonial, só o índice fixo do candidato que falhou.
     */
    data class Falhou(val indice: Int) : ResultadoExclusaoBackupAutomatico() {
        override fun toString(): String = "Falha ao excluir sidecar do backup automático (índice $indice)"
    }
}

/**
 * Candidatos de sidecar do arquivo principal [caminhoBanco], dado o modo de jornal REAL desta
 * implementação: nem [SQLiteCifrado] nem [RepositorioItensPatrimoniaisSQLCipher] definem
 * `PRAGMA journal_mode` em nenhum ponto (confirmado por leitura de código antes desta correção) —
 * o SQLite usa, portanto, o padrão de *rollback journal* (`-journal`), nunca WAL, ao contrário do
 * Android/Room (que habilita WAL de propósito, ver `RepositorioItensPatrimoniaisRoom.modoJournal`).
 *
 * `-wal`/`-shm` são mantidos aqui só como cobertura defensiva — [excluirArquivoDoBackupAutomatico]
 * trata arquivo ausente como um no-op sem custo, então incluir candidatos que hoje nunca existem
 * não tem efeito colateral, e protege contra uma mudança futura de `journal_mode` sem exigir
 * lembrar de atualizar esta lista. Não é uma afirmação de que WAL está em uso hoje no iOS — não
 * está.
 */
internal fun candidatosDeSidecarDoBanco(caminhoBanco: String): List<String> = listOf(
    caminhoBanco,
    "$caminhoBanco-journal",
    "$caminhoBanco-wal",
    "$caminhoBanco-shm",
)

/**
 * Exclui [caminhoArquivo] do backup automático do sistema (iCloud/iTunes) via
 * `NSURLIsExcludedFromBackupKey` — API pública documentada pela Apple desde o iOS 5.0.1
 * (`NSURL.setResourceValue(_:forKey:error:)`). Nunca SPI privada — regra dura do projeto (ver
 * ADR-002 e o histórico do PR #228 sobre o backup criptografado, que já rejeitou SPI privada do
 * CommonCrypto pelo mesmo motivo).
 *
 * Isto é só sobre o arquivo interno do cofre (`savro.db` e seus sidecars) — não tem nenhuma
 * relação com o backup MANUAL do app (`*.savrobackup`, #121), que continua funcionando
 * normalmente por ser ação explícita do usuário. O que fica excluído aqui é só a cópia automática
 * que o sistema faria do arquivo interno em backups de iCloud/iTunes.
 *
 * Nunca lança exceção e nunca falha a abertura do banco: arquivo ausente é tratado como "nada a
 * excluir", não como erro — comum para sidecars transitórios como `-journal`.
 */
@OptIn(ExperimentalForeignApi::class)
internal fun excluirArquivoDoBackupAutomatico(
    caminhoArquivo: String,
    indice: Int,
): ResultadoExclusaoBackupAutomatico {
    if (!NSFileManager.defaultManager().fileExistsAtPath(caminhoArquivo)) {
        return ResultadoExclusaoBackupAutomatico.ArquivoInexistente
    }
    val url = NSURL.fileURLWithPath(caminhoArquivo)
    val sucesso = url.setResourceValue(true, forKey = NSURLIsExcludedFromBackupKey, error = null)
    return if (sucesso) {
        ResultadoExclusaoBackupAutomatico.Excluido
    } else {
        ResultadoExclusaoBackupAutomatico.Falhou(indice)
    }
}

/**
 * Exclui o banco principal e todos os seus sidecars candidatos do backup automático do sistema.
 * Chamado uma vez logo após a criação/abertura bem-sucedida do banco
 * ([RepositorioItensPatrimoniaisSQLCipher.abrirComChave]) — best-effort: o resultado nunca altera
 * o fluxo de abertura do cofre, nem em sucesso nem em falha parcial.
 */
internal fun excluirBancoDoBackupAutomatico(caminhoBanco: String): List<ResultadoExclusaoBackupAutomatico> =
    candidatosDeSidecarDoBanco(caminhoBanco).mapIndexed { indice, caminho ->
        excluirArquivoDoBackupAutomatico(caminho, indice)
    }
