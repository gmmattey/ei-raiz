package io.savro.backup

import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ExportadorCsvTest {

    private fun linhas(csv: String): List<String> =
        csv.removePrefix(ExportadorCsv.BOM_UTF8).split("\r\n").filter { it.isNotEmpty() }

    @Test
    fun cabecalhoCanonicoNaOrdemDocumentada() {
        val csv = ExportadorCsv.exportar(emptyList())

        assertEquals(
            "id,tipo,nome,valor,valor_centavos,moeda,instituicao,observacao,quantidade," +
                "preco_medio,origem,arquivado,criado_em,atualizado_em",
            linhas(csv).single(),
        )
    }

    @Test
    fun arquivoComecaComBomUtf8() {
        assertTrue(ExportadorCsv.exportar(emptyList()).startsWith(ExportadorCsv.BOM_UTF8))
    }

    @Test
    fun terminadorDeLinhaEhCrLf() {
        val csv = ExportadorCsv.exportar(listOf(itemDeTeste("a")))

        assertTrue(csv.endsWith("\r\n"))
        assertEquals(2, csv.split("\r\n").size - 1)
    }

    @Test
    fun virgulaAspasEQuebraDeLinhaSaoEscapadasConformeRfc4180() {
        val item = itemDeTeste(
            id = "a",
            nome = "Ação \"boa\", muito boa",
            observacao = "primeira linha\nsegunda linha",
            instituicao = "Banco, S.A.",
        )

        val linha = linhas(ExportadorCsv.exportar(listOf(item)))[1]

        assertTrue(linha.contains("\"Ação \"\"boa\"\", muito boa\""), linha)
        assertTrue(linha.contains("\"primeira linha\nsegunda linha\""), linha)
        assertTrue(linha.contains("\"Banco, S.A.\""), linha)
    }

    @Test
    fun acentosSaoPreservadosNaCodificacaoUtf8() {
        val item = itemDeTeste(id = "a", nome = "Poupança João Ação Ônix üê")

        val bytes = ExportadorCsv.exportarComoBytes(listOf(item))

        assertTrue(bytes.decodeToString().contains("Poupança João Ação Ônix üê"))
    }

    @Test
    fun valoresSaemComoTextoLegivelEComoCentavosInteiros() {
        val item = itemDeTeste(id = "a", valorCentavos = -123_456L, tipo = TipoItemPatrimonial.DIVIDA)

        val colunas = linhas(ExportadorCsv.exportar(listOf(item)))[1].split(",")

        assertEquals("-1234.56", colunas[3])
        assertEquals("-123456", colunas[4])
    }

    @Test
    fun datasSaemEmIso8601Utc() {
        val colunas = linhas(ExportadorCsv.exportar(listOf(itemDeTeste("a")))).last().split(",")

        assertEquals("2023-11-14T22:13:20Z", colunas[12])
        assertEquals("2023-11-14T22:13:21Z", colunas[13])
    }

    @Test
    fun ordemDeLinhasEhEstavelPorId() {
        val csv = ExportadorCsv.exportar(listOf(itemDeTeste("c"), itemDeTeste("a"), itemDeTeste("b")))

        val ids = linhas(csv).drop(1).map { it.substringBefore(",") }
        assertEquals(listOf("a", "b", "c"), ids)
    }

    @Test
    fun camposOpcionaisAusentesViramColunaVazia() {
        val item = itemDeTeste("a", instituicao = null, observacao = null)

        val colunas = linhas(ExportadorCsv.exportar(listOf(item)))[1].split(",")

        assertEquals("", colunas[6])
        assertEquals("", colunas[7])
    }
}
