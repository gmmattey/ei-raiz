package io.savro.model

/**
 * Schema mínimo do cofre local, suficiente para provar persistência cifrada ponta a ponta
 * (#180). Regras completas de patrimônio (cálculo, histórico, score) não pertencem a esta issue.
 */
enum class TipoItemPatrimonial {
    CONTA,
    INVESTIMENTO,
    IMOVEL,
    VEICULO,
    OUTRO,
}

/**
 * Item patrimonial persistido no cofre local. `valorCentavos` evita ponto flutuante em dado
 * financeiro. `instituicao` e `observacao` são opcionais e nunca aparecem em log — o repositório
 * de persistência é a única camada autorizada a lê-los em texto claro, e só depois do cofre
 * aberto com material criptográfico válido.
 */
data class ItemPatrimonial(
    val id: String,
    val tipo: TipoItemPatrimonial,
    val nome: String,
    val valorCentavos: Long,
    val instituicao: String?,
    val observacao: String?,
    val criadoEmEpocaMs: Long,
    val atualizadoEmEpocaMs: Long,
)

/** Metadados técnicos do banco local — não é um relatório de patrimônio, é estado de infra. */
data class MetadadosBancoLocal(
    val versaoEsquema: Int,
    val totalDeItens: Int,
)
