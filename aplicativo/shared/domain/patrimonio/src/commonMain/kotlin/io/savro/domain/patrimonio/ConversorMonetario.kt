package io.savro.domain.patrimonio

/**
 * Conversão texto digitado <-> inteiro escalado, sem `Double`/`Float` em nenhum ponto (regra da
 * issue #119: "valores monetários nunca usam Double"). Aceita `,` ou `.` como separador decimal —
 * o último separador encontrado é tratado como decimal, os demais como separador de milhar e
 * descartados; qualquer outro caractere não numérico também é descartado.
 */
object ConversorMonetario {

    /** Texto do usuário -> centavos. `null` se o texto não contiver nenhum dígito. */
    fun paraCentavos(texto: String): Long? = paraInteiroEscalado(texto, casasDecimais = 2)

    /** Centavos -> texto com separador decimal `.` (a tela formata exibição/moeda por cima). */
    fun centavosParaTexto(centavos: Long): String = inteiroEscaladoParaTexto(centavos, casasDecimais = 2)

    /** Texto do usuário -> quantidade escalada por 1000 (3 casas decimais). `null` se vazio/inválido. */
    fun paraQuantidadeMilesimos(texto: String): Long? = paraInteiroEscalado(texto, casasDecimais = 3)

    fun quantidadeMilesimosParaTexto(milesimos: Long): String = inteiroEscaladoParaTexto(milesimos, casasDecimais = 3)

    private fun paraInteiroEscalado(textoOriginal: String, casasDecimais: Int): Long? {
        val texto = textoOriginal.trim()
        if (texto.isEmpty()) return null

        val negativo = texto.startsWith("-")
        val semSinal = if (negativo) texto.substring(1) else texto

        val indiceSeparador = semSinal.indexOfLast { it == ',' || it == '.' }
        val parteInteira: String
        val parteDecimal: String
        if (indiceSeparador == -1) {
            parteInteira = semSinal.filter { it.isDigit() }
            parteDecimal = ""
        } else {
            parteInteira = semSinal.substring(0, indiceSeparador).filter { it.isDigit() }
            parteDecimal = semSinal.substring(indiceSeparador + 1).filter { it.isDigit() }
        }

        if (parteInteira.isEmpty() && parteDecimal.isEmpty()) return null

        val decimaisNormalizadas = parteDecimal.padEnd(casasDecimais, '0').take(casasDecimais)
        val inteiroNormalizado = parteInteira.ifEmpty { "0" }
        val digitosCombinados = (inteiroNormalizado + decimaisNormalizadas).trimStart('0').ifEmpty { "0" }
        val valorAbsoluto = digitosCombinados.toLongOrNull() ?: return null

        return if (negativo) -valorAbsoluto else valorAbsoluto
    }

    private fun inteiroEscaladoParaTexto(valor: Long, casasDecimais: Int): String {
        val negativo = valor < 0
        val absoluto = if (negativo) (-valor) else valor
        val texto = absoluto.toString().padStart(casasDecimais + 1, '0')
        val parteInteira = texto.dropLast(casasDecimais)
        val parteDecimal = texto.takeLast(casasDecimais)
        return (if (negativo) "-" else "") + parteInteira + "." + parteDecimal
    }
}
