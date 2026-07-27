package io.savro.domain.patrimonio

import io.savro.model.TipoItemPatrimonial

/** Campo do formulário de item patrimonial — usado para decidir o que pedir por tipo (issue #119). */
enum class CampoFormularioItem {
    TIPO,
    NOME,
    VALOR,
    MOEDA,
    INSTITUICAO,
    OBSERVACAO,
    QUANTIDADE,
    PRECO_MEDIO,
}

/**
 * Estado do formulário de criação/edição de item patrimonial (issue #119), 100% em `commonMain` —
 * regra de negócio e estado de formulário não pertencem à camada de UI de nenhuma plataforma.
 * Campos monetários ficam como texto bruto digitado pelo usuário; a conversão para os tipos
 * inteiros escalados (`ConversorMonetario`) só acontece na validação, para que o campo de texto
 * possa representar estados intermediários inválidos (ex.: "12,") sem perder o que o usuário
 * digitou.
 */
data class EstadoFormularioItemPatrimonial(
    val itemIdEmEdicao: String? = null,
    val tipo: TipoItemPatrimonial? = null,
    val nome: String = "",
    val valorTexto: String = "",
    val moeda: String = "BRL",
    val instituicao: String = "",
    val observacao: String = "",
    val quantidadeTexto: String = "",
    val precoMedioTexto: String = "",
) {
    val estaEditando: Boolean get() = itemIdEmEdicao != null

    /**
     * Campos visíveis para o [tipo] atual (issue #119: "solicitar somente campos necessários para
     * o tipo selecionado"). Sem `tipo` escolhido, só o seletor de tipo é pedido. Quantidade/preço
     * médio só aparecem em `RENDA_VARIAVEL`, e mesmo lá são opcionais — nunca obrigatórios (o
     * usuário pode controlar o item só pelo valor atual).
     */
    fun camposVisiveis(): Set<CampoFormularioItem> {
        if (tipo == null) return setOf(CampoFormularioItem.TIPO)
        val base = mutableSetOf(
            CampoFormularioItem.TIPO,
            CampoFormularioItem.NOME,
            CampoFormularioItem.VALOR,
            CampoFormularioItem.MOEDA,
            CampoFormularioItem.INSTITUICAO,
            CampoFormularioItem.OBSERVACAO,
        )
        if (tipo == TipoItemPatrimonial.RENDA_VARIAVEL) {
            base += CampoFormularioItem.QUANTIDADE
            base += CampoFormularioItem.PRECO_MEDIO
        }
        return base
    }

    fun camposObrigatorios(): Set<CampoFormularioItem> = setOf(
        CampoFormularioItem.TIPO,
        CampoFormularioItem.NOME,
        CampoFormularioItem.VALOR,
        CampoFormularioItem.MOEDA,
    )
}

/**
 * Serialização estável do rascunho de formulário para preservação de lifecycle (issue #119:
 * "preservar formulário durante transições previstas de Android e iOS"). Cada campo vira uma
 * linha `chave:tamanho:valor` (formato "length-prefixed", sem dependência de biblioteca de
 * serialização e sem caractere delimitador que possa colidir com o texto digitado pelo usuário) —
 * cada plataforma guarda essa string onde fizer sentido (`SavedStateHandle`/Bundle no Android,
 * mecanismo equivalente de restauração de cena no iOS; a implementação do adapter é
 * responsabilidade de cada host, este arquivo só define o contrato comum, testável sem nenhuma
 * API de plataforma). Campos vazios não são escritos; um rascunho totalmente vazio serializa para
 * string vazia.
 */
object RascunhoFormularioItem {

    private val PADRAO = EstadoFormularioItemPatrimonial()

    fun serializar(estado: EstadoFormularioItemPatrimonial): String {
        val campos = linkedMapOf(
            "itemIdEmEdicao" to estado.itemIdEmEdicao.orEmpty(),
            "tipo" to (estado.tipo?.name.orEmpty()),
            "nome" to estado.nome,
            "valorTexto" to estado.valorTexto,
            // Só grava 'moeda' quando o usuário mudou do padrão — senão um formulário intocado
            // (nada digitado ainda) já não serializaria para string vazia.
            "moeda" to estado.moeda.takeIf { it != PADRAO.moeda }.orEmpty(),
            "instituicao" to estado.instituicao,
            "observacao" to estado.observacao,
            "quantidadeTexto" to estado.quantidadeTexto,
            "precoMedioTexto" to estado.precoMedioTexto,
        )
        return campos
            .filterValues { it.isNotEmpty() }
            .entries
            .joinToString(separator = "") { (chave, valor) -> "$chave:${valor.length}:$valor" }
    }

    fun restaurar(rascunho: String): EstadoFormularioItemPatrimonial {
        if (rascunho.isEmpty()) return EstadoFormularioItemPatrimonial()

        val campos = mutableMapOf<String, String>()
        var posicao = 0
        while (posicao < rascunho.length) {
            val fimChave = rascunho.indexOf(':', posicao)
            if (fimChave == -1) break
            val chave = rascunho.substring(posicao, fimChave)

            val fimTamanho = rascunho.indexOf(':', fimChave + 1)
            if (fimTamanho == -1) break
            val tamanho = rascunho.substring(fimChave + 1, fimTamanho).toIntOrNull() ?: break

            val inicioValor = fimTamanho + 1
            val fimValor = inicioValor + tamanho
            if (fimValor > rascunho.length) break
            campos[chave] = rascunho.substring(inicioValor, fimValor)
            posicao = fimValor
        }

        return EstadoFormularioItemPatrimonial(
            itemIdEmEdicao = campos["itemIdEmEdicao"]?.takeIf { it.isNotEmpty() },
            tipo = campos["tipo"]?.takeIf { it.isNotEmpty() }
                ?.let { runCatching { TipoItemPatrimonial.valueOf(it) }.getOrNull() },
            nome = campos["nome"].orEmpty(),
            valorTexto = campos["valorTexto"].orEmpty(),
            moeda = campos["moeda"]?.takeIf { it.isNotEmpty() } ?: "BRL",
            instituicao = campos["instituicao"].orEmpty(),
            observacao = campos["observacao"].orEmpty(),
            quantidadeTexto = campos["quantidadeTexto"].orEmpty(),
            precoMedioTexto = campos["precoMedioTexto"].orEmpty(),
        )
    }
}
