package io.savro.backup

/**
 * Escritor/leitor de JSON canônico para o corpo do `*.savrobackup` (#121).
 *
 * Por que não `kotlinx.serialization`: o requisito aqui é **byte-determinismo** entre Android e
 * iOS (o mesmo conteúdo tem que produzir exatamente os mesmos bytes nas duas plataformas, senão o
 * vetor de teste compartilhado não prova nada). Um escritor de 100 linhas com ordem de chaves
 * fixa, sem espaços, sem ponto flutuante e com escaping explícito é auditável de uma sentada e
 * não depende de nenhuma decisão interna de biblioteca que possa mudar entre versões. Também
 * evita uma dependência nova só para isto.
 *
 * Subconjunto suportado, e só ele: objeto, lista, string, inteiro (`Long`), booleano e `null`.
 * Não existe número fracionário no modelo do Savro — valores monetários são inteiros em centavos.
 */
internal object JsonCanonico {

    fun escrever(valor: ValorJson): String = StringBuilder().also { escreverEm(it, valor) }.toString()

    fun ler(texto: String): ValorJson? {
        val leitor = LeitorJson(texto)
        val valor = leitor.lerValor() ?: return null
        leitor.pularEspacos()
        return if (leitor.fim()) valor else null
    }

    private fun escreverEm(saida: StringBuilder, valor: ValorJson) {
        when (valor) {
            is ValorJson.Objeto -> {
                saida.append('{')
                // Ordem alfabética de chaves: independe da ordem de inserção e do runtime.
                valor.campos.entries.sortedBy { it.key }.forEachIndexed { indice, campo ->
                    if (indice > 0) saida.append(',')
                    escreverTexto(saida, campo.key)
                    saida.append(':')
                    escreverEm(saida, campo.value)
                }
                saida.append('}')
            }
            is ValorJson.Lista -> {
                saida.append('[')
                valor.itens.forEachIndexed { indice, item ->
                    if (indice > 0) saida.append(',')
                    escreverEm(saida, item)
                }
                saida.append(']')
            }
            is ValorJson.Texto -> escreverTexto(saida, valor.valor)
            is ValorJson.Inteiro -> saida.append(valor.valor.toString())
            is ValorJson.Booleano -> saida.append(if (valor.valor) "true" else "false")
            ValorJson.Nulo -> saida.append("null")
        }
    }

    /**
     * Escaping conforme RFC 8259: obrigatoriamente `"`, `\` e controles < 0x20. Caracteres
     * acentuados e emoji saem literais em UTF-8 (não `\uXXXX`) — determinístico e menor.
     */
    private fun escreverTexto(saida: StringBuilder, texto: String) {
        saida.append('"')
        texto.forEach { caractere ->
            when {
                caractere == '"' -> saida.append("\\\"")
                caractere == '\\' -> saida.append("\\\\")
                caractere == '\n' -> saida.append("\\n")
                caractere == '\r' -> saida.append("\\r")
                caractere == '\t' -> saida.append("\\t")
                caractere == '\b' -> saida.append("\\b")
                caractere == '\u000C' -> saida.append("\\f")
                caractere < ' ' -> saida.append("\\u").append(caractere.code.paraHex4())
                else -> saida.append(caractere)
            }
        }
        saida.append('"')
    }

    private fun Int.paraHex4(): String {
        val digitos = "0123456789abcdef"
        return buildString {
            append(digitos[(this@paraHex4 shr 12) and 0xF])
            append(digitos[(this@paraHex4 shr 8) and 0xF])
            append(digitos[(this@paraHex4 shr 4) and 0xF])
            append(digitos[this@paraHex4 and 0xF])
        }
    }
}

internal sealed class ValorJson {
    data class Objeto(val campos: Map<String, ValorJson>) : ValorJson()
    data class Lista(val itens: List<ValorJson>) : ValorJson()
    data class Texto(val valor: String) : ValorJson()
    data class Inteiro(val valor: Long) : ValorJson()
    data class Booleano(val valor: Boolean) : ValorJson()
    data object Nulo : ValorJson()

    fun objeto(): Objeto? = this as? Objeto
    fun lista(): List<ValorJson>? = (this as? Lista)?.itens
    fun texto(): String? = (this as? Texto)?.valor
    fun inteiro(): Long? = (this as? Inteiro)?.valor
    fun booleano(): Boolean? = (this as? Booleano)?.valor
}

internal fun ValorJson.Objeto.campo(nome: String): ValorJson? = campos[nome]?.takeIf { it != ValorJson.Nulo }

/** Descida recursiva; devolve `null` em qualquer entrada malformada, sem lançar exceção. */
private class LeitorJson(private val texto: String) {
    private var posicao = 0

    fun fim(): Boolean = posicao >= texto.length

    fun pularEspacos() {
        while (posicao < texto.length && texto[posicao].ehEspacoJson()) posicao++
    }

    fun lerValor(): ValorJson? {
        pularEspacos()
        if (fim()) return null
        return when (texto[posicao]) {
            '{' -> lerObjeto()
            '[' -> lerLista()
            '"' -> lerTexto()?.let { ValorJson.Texto(it) }
            't' -> consumir("true")?.let { ValorJson.Booleano(true) }
            'f' -> consumir("false")?.let { ValorJson.Booleano(false) }
            'n' -> consumir("null")?.let { ValorJson.Nulo }
            else -> lerInteiro()
        }
    }

    private fun consumir(literal: String): Unit? {
        if (!texto.startsWith(literal, posicao)) return null
        posicao += literal.length
        return Unit
    }

    private fun lerObjeto(): ValorJson? {
        posicao++
        val campos = LinkedHashMap<String, ValorJson>()
        pularEspacos()
        if (posicao < texto.length && texto[posicao] == '}') {
            posicao++
            return ValorJson.Objeto(campos)
        }
        while (true) {
            pularEspacos()
            val chave = lerTexto() ?: return null
            pularEspacos()
            if (posicao >= texto.length || texto[posicao] != ':') return null
            posicao++
            val valor = lerValor() ?: return null
            campos[chave] = valor
            pularEspacos()
            if (posicao >= texto.length) return null
            when (texto[posicao]) {
                ',' -> posicao++
                '}' -> {
                    posicao++
                    return ValorJson.Objeto(campos)
                }
                else -> return null
            }
        }
    }

    private fun lerLista(): ValorJson? {
        posicao++
        val itens = mutableListOf<ValorJson>()
        pularEspacos()
        if (posicao < texto.length && texto[posicao] == ']') {
            posicao++
            return ValorJson.Lista(itens)
        }
        while (true) {
            val valor = lerValor() ?: return null
            itens += valor
            pularEspacos()
            if (posicao >= texto.length) return null
            when (texto[posicao]) {
                ',' -> posicao++
                ']' -> {
                    posicao++
                    return ValorJson.Lista(itens)
                }
                else -> return null
            }
        }
    }

    private fun lerTexto(): String? {
        if (posicao >= texto.length || texto[posicao] != '"') return null
        posicao++
        val conteudo = StringBuilder()
        while (posicao < texto.length) {
            when (val caractere = texto[posicao]) {
                '"' -> {
                    posicao++
                    return conteudo.toString()
                }
                '\\' -> {
                    posicao++
                    if (posicao >= texto.length) return null
                    when (val escapado = texto[posicao]) {
                        '"', '\\', '/' -> conteudo.append(escapado)
                        'n' -> conteudo.append('\n')
                        'r' -> conteudo.append('\r')
                        't' -> conteudo.append('\t')
                        'b' -> conteudo.append('\b')
                        'f' -> conteudo.append('\u000C')
                        'u' -> {
                            if (posicao + 4 >= texto.length) return null
                            val codigo = texto.substring(posicao + 1, posicao + 5).toIntOrNull(16) ?: return null
                            conteudo.append(codigo.toChar())
                            posicao += 4
                        }
                        else -> return null
                    }
                    posicao++
                }
                else -> {
                    conteudo.append(caractere)
                    posicao++
                }
            }
        }
        return null
    }

    private fun lerInteiro(): ValorJson? {
        val inicio = posicao
        if (posicao < texto.length && texto[posicao] == '-') posicao++
        val inicioDigitos = posicao
        while (posicao < texto.length && texto[posicao].ehDigito()) posicao++
        if (posicao == inicioDigitos) return null
        // Ponto flutuante e notação exponencial não fazem parte do formato: qualquer valor
        // fracionário aqui é sinal de arquivo estranho, não de conteúdo válido.
        if (posicao < texto.length && (texto[posicao] == '.' || texto[posicao] == 'e' || texto[posicao] == 'E')) {
            return null
        }
        return texto.substring(inicio, posicao).toLongOrNull()?.let { ValorJson.Inteiro(it) }
    }

    private fun Char.ehEspacoJson(): Boolean = this == ' ' || this == '\n' || this == '\r' || this == '\t'

    private fun Char.ehDigito(): Boolean = this in '0'..'9'
}
