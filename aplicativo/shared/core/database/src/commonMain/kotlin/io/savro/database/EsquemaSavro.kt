package io.savro.database

/**
 * Descrição lógica do schema do cofre — comum às duas plataformas mesmo com engines físicas
 * diferentes (Room/SQLCipher no Android, SQLCipher via cinterop no iOS). `androidMain`/`iosMain`
 * devem ter exatamente uma migration real por [DescricaoMigracao] listada aqui; o teste de
 * contrato (`:shared:core:testing`) falha se as versões não baterem.
 *
 * Também é a base do formato lógico compatível com `*.savrobackup` (#121) — a serialização do
 * backup usa esta mesma noção de versão de schema, não a versão interna de nenhuma engine física.
 */
object EsquemaSavro {
    const val NOME_BANCO = "savro.db"
    const val VERSAO_ATUAL = 4

    val migracoes: List<DescricaoMigracao> = listOf(
        DescricaoMigracao(
            versaoOrigem = 1,
            versaoDestino = 2,
            descricao = "Adiciona coluna opcional 'observacao' em itens_patrimoniais",
        ),
        DescricaoMigracao(
            versaoOrigem = 2,
            versaoDestino = 3,
            descricao = "Cadastro manual de patrimônio (#119): adiciona 'moeda', 'quantidade_milesimos', " +
                "'preco_medio_centavos', 'origem' e 'arquivado' em itens_patrimoniais; remapeia " +
                "'INVESTIMENTO'->'RENDA_VARIAVEL' e 'IMOVEL'/'VEICULO'->'BEM' na coluna 'tipo'; cria a " +
                "tabela 'ajustes_valor_item'",
        ),
        DescricaoMigracao(
            versaoOrigem = 3,
            versaoDestino = 4,
            descricao = "Linha do tempo básica (#120): cria a tabela 'eventos_timeline_item' " +
                "(id, item_id, item_nome, tipo, data_epoca_ms), FK item_id -> itens_patrimoniais ON DELETE CASCADE",
        ),
    )
}

data class DescricaoMigracao(
    val versaoOrigem: Int,
    val versaoDestino: Int,
    val descricao: String,
)
