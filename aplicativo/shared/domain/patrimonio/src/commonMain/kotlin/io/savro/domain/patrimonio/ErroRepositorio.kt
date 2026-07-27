package io.savro.domain.patrimonio

/**
 * Vocabulário de erro do cofre local, independente de engine (Room/SQLCipher no Android,
 * SQLCipher via cinterop no iOS). A implementação de plataforma traduz a exceção nativa para um
 * destes casos — nunca propaga o tipo nativo (`SQLiteException`, `NSError`, etc.) até o domínio.
 *
 * `mensagem` é sempre um texto técnico seguro para log: nunca contém valor patrimonial, senha,
 * passphrase, bytes de chave ou SQL com parâmetros.
 */
sealed class ErroRepositorio(open val mensagem: String) {
    /** Material criptográfico ausente, incorreto ou invalidado pelo sistema (Keystore/Keychain). */
    data class ChaveInvalida(override val mensagem: String) : ErroRepositorio(mensagem)

    /** O banco não abriu por motivo diferente de chave inválida (arquivo corrompido, I/O, etc.). */
    data class FalhaAbertura(override val mensagem: String) : ErroRepositorio(mensagem)

    /** Uma migration de schema falhou. O banco permanece na versão anterior, nunca é recriado. */
    data class FalhaMigracao(override val mensagem: String, val versaoOrigem: Int, val versaoDestino: Int) :
        ErroRepositorio(mensagem)

    /** Uma transação não pôde ser concluída; todas as operações dela foram revertidas. */
    data class FalhaTransacao(override val mensagem: String) : ErroRepositorio(mensagem)

    /** Operação por id que não encontrou o item (não é necessariamente erro de infraestrutura). */
    data class ItemNaoEncontrado(val id: String) : ErroRepositorio("Item '$id' não encontrado")

    /** Falha não classificada acima — deve ser rara; cada ocorrência é candidata a virar um caso novo. */
    data class Desconhecido(override val mensagem: String) : ErroRepositorio(mensagem)
}
