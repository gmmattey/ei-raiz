package io.savro.common

/**
 * Substituto comum para exceções em contratos de plataforma (persistência, rede, segurança):
 * força quem chama a tratar falha explicitamente, sem depender de `try/catch` espalhado nem de
 * tipos de exceção específicos de uma engine concreta (Room, SQLCipher, Keychain, etc.).
 */
sealed class Resultado<out T, out E> {
    data class Sucesso<out T>(val valor: T) : Resultado<T, Nothing>()
    data class Falha<out E>(val erro: E) : Resultado<Nothing, E>()

    inline fun <R> mapear(transformar: (T) -> R): Resultado<R, E> = when (this) {
        is Sucesso -> Sucesso(transformar(valor))
        is Falha -> this
    }

    inline fun <R> mapearErro(transformar: (E) -> R): Resultado<T, R> = when (this) {
        is Sucesso -> this
        is Falha -> Falha(transformar(erro))
    }

    fun valorOuNulo(): T? = (this as? Sucesso<T>)?.valor
}
