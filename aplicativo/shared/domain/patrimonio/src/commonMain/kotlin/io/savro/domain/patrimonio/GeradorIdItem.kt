package io.savro.domain.patrimonio

import kotlin.random.Random

/**
 * Identificador local aleatório (128 bits, hexadecimal) para itens e ajustes patrimoniais. Não
 * depende de nenhuma API de plataforma (`kotlin.random.Random` é stdlib comum) — dispensa uma
 * dependência de UUID só para gerar uma chave primária local que nunca precisa ser globalmente
 * única fora do dispositivo do usuário.
 */
object GeradorIdItem {
    fun novoId(): String = (1..4)
        .joinToString("") { Random.nextInt(0, 0x10000).toString(16).padStart(4, '0') }
}
