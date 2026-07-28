package io.savro.backup

import io.savro.domain.patrimonio.ConversorMonetario
import io.savro.domain.patrimonio.calculo.FormatadorData
import io.savro.model.ItemPatrimonial

/**
 * Exportação legível em CSV (#121), conforme RFC 4180: separador `,`, terminador `CRLF`, campos
 * com `,`, `"`, CR ou LF entre aspas duplas e aspas internas duplicadas.
 *
 * **Esta saída não tem a proteção do backup criptografado** — é texto claro, e a UI diz isso antes
 * de exportar. O formato está documentado em `documentacao/arquitetura/formato-csv-savro.md`.
 *
 * Emite BOM UTF-8 no começo do arquivo: sem ele, Excel em português abre `Instituição` como
 * `InstituiÃ§Ã£o`. O BOM é opcional em UTF-8 e ignorado por leitores que seguem a RFC.
 */
object ExportadorCsv {

    val COLUNAS: List<String> = listOf(
        "id",
        "tipo",
        "nome",
        "valor",
        "valor_centavos",
        "moeda",
        "instituicao",
        "observacao",
        "quantidade",
        "preco_medio",
        "origem",
        "arquivado",
        "criado_em",
        "atualizado_em",
    )

    const val BOM_UTF8: String = "﻿"
    private const val FIM_DE_LINHA = "\r\n"

    fun exportar(itens: List<ItemPatrimonial>): String {
        val saida = StringBuilder(BOM_UTF8)
        saida.append(COLUNAS.joinToString(",") { campo(it) }).append(FIM_DE_LINHA)
        itens.sortedBy { it.id }.forEach { item ->
            saida.append(linha(item)).append(FIM_DE_LINHA)
        }
        return saida.toString()
    }

    fun exportarComoBytes(itens: List<ItemPatrimonial>): ByteArray = exportar(itens).encodeToByteArray()

    private fun linha(item: ItemPatrimonial): String = listOf(
        item.id,
        item.tipo.name,
        item.nome,
        // Valor legível com ponto decimal e sem separador de milhar: é o mesmo texto que o app usa
        // internamente e não colide com o separador de campo do CSV. `valor_centavos` ao lado é a
        // coluna canônica, inteira, para quem for reimportar em planilha ou script.
        ConversorMonetario.centavosParaTexto(item.valorCentavos),
        item.valorCentavos.toString(),
        item.moeda,
        item.instituicao.orEmpty(),
        item.observacao.orEmpty(),
        item.quantidadeMilesimos?.let { ConversorMonetario.quantidadeMilesimosParaTexto(it) }.orEmpty(),
        item.precoMedioCentavos?.let { ConversorMonetario.centavosParaTexto(it) }.orEmpty(),
        item.origem.name,
        if (item.arquivado) "sim" else "nao",
        FormatadorData.paraDataHoraIsoUtc(item.criadoEmEpocaMs),
        FormatadorData.paraDataHoraIsoUtc(item.atualizadoEmEpocaMs),
    ).joinToString(",") { campo(it) }

    private fun campo(valor: String): String {
        val precisaDeAspas = valor.any { it == ',' || it == '"' || it == '\n' || it == '\r' }
        return if (precisaDeAspas) "\"" + valor.replace("\"", "\"\"") + "\"" else valor
    }

    fun nomeDeArquivoSugerido(dataEpocaMs: Long): String =
        "savro-${FormatadorData.paraDataDeArquivo(dataEpocaMs)}.csv"

    const val TIPO_MIME: String = "text/csv"
}
