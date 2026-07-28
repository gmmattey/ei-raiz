package io.savro.backup

/**
 * Integração com os mecanismos nativos de arquivo (#121): Storage Access Framework no Android,
 * `UIDocumentPickerViewController` no iOS. Contrato em `commonMain`, implementação em
 * `androidMain`/`iosMain` do mesmo módulo.
 *
 * É interface injetada, não `expect/actual`, por um motivo prático: as duas implementações
 * precisam de uma referência viva de UI (`ComponentActivity` no Android, `UIViewController` no
 * iOS) que um `expect object` sem estado não teria como receber. A fronteira de plataforma
 * continua sendo esta — `:shared:app` nunca vê `Intent`, `Uri` nem `UIDocumentPicker`.
 */
interface ArquivosDoSistema {

    /**
     * Abre o seletor nativo para o usuário escolher onde salvar [caminhoTemporario].
     * Devolve `false` se o usuário cancelar. Nunca envia nada para rede.
     */
    suspend fun salvar(caminhoTemporario: String, nomeSugerido: String, tipoMime: String): Boolean

    /** Abre o seletor nativo de leitura. Devolve o conteúdo, ou `null` se o usuário cancelar. */
    suspend fun selecionar(tipoMime: String, extensao: String): ByteArray?
}

/**
 * Área temporária protegida da plataforma (cache privado do app). Os arquivos gravados aqui são
 * sempre removidos por [ServicoBackup] ao concluir, cancelar **ou** falhar — nunca fica um
 * `*.savrobackup` ou CSV esquecido no aparelho.
 */
interface AreaTemporariaBackup {
    suspend fun gravar(nome: String, conteudo: ByteArray): String
    suspend fun remover(caminho: String)
}
