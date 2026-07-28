package io.savro.domain.patrimonio.calculo

/**
 * Formatação de data mínima, sem depender de `kotlinx-datetime` (evita introduzir dependência
 * externa nova só para "dd/mm/aaaa" — decisão que precisaria de aprovação explícita fora do
 * escopo desta issue). Usa o algoritmo civil-a-partir-de-dias de Howard Hinnant (domínio público,
 * inteiro, correto para todo o intervalo de datas do calendário gregoriano) sobre UTC — sem
 * `Double`, sem fuso horário local (a data exibida é só "quando o evento aconteceu", não precisa
 * de precisão de fuso para o MVP1).
 */
object FormatadorData {

    fun paraDataCurta(epocaMs: Long): String {
        val diasDesdeEpoca = epocaMs.floorDiv(MS_POR_DIA)
        val (ano, mes, dia) = civilDeDias(diasDesdeEpoca)
        return "${dia.pad()}/${mes.pad()}/$ano"
    }

    /** `aaaa-mm-dd` (UTC) — usado em nome de arquivo de backup/CSV (#121), onde `dd/mm/aaaa` não serve. */
    fun paraDataDeArquivo(epocaMs: Long): String {
        val (ano, mes, dia) = civilDeDias(epocaMs.floorDiv(MS_POR_DIA))
        return "$ano-${mes.pad()}-${dia.pad()}"
    }

    /**
     * `aaaa-mm-ddThh:mm:ssZ` (ISO 8601 em UTC) — formato de data das colunas do CSV (#121). UTC
     * explícito no sufixo `Z` para que a exportação seja interpretável sem saber o fuso do
     * aparelho que a gerou.
     */
    fun paraDataHoraIsoUtc(epocaMs: Long): String {
        val diasDesdeEpoca = epocaMs.floorDiv(MS_POR_DIA)
        val (ano, mes, dia) = civilDeDias(diasDesdeEpoca)
        val msDoDia = epocaMs - diasDesdeEpoca * MS_POR_DIA
        val segundosDoDia = (msDoDia / 1000L).toInt()
        val hora = segundosDoDia / 3600
        val minuto = (segundosDoDia % 3600) / 60
        val segundo = segundosDoDia % 60
        return "$ano-${mes.pad()}-${dia.pad()}T${hora.pad()}:${minuto.pad()}:${segundo.pad()}Z"
    }

    private const val MS_POR_DIA = 24L * 60L * 60L * 1000L

    private fun Int.pad(): String = if (this < 10) "0$this" else toString()

    /** Howard Hinnant, "chrono-Compatible Low-Level Date Algorithms", `civil_from_days`. */
    private fun civilDeDias(diasEpoca: Long): Triple<Int, Int, Int> {
        val z = diasEpoca + 719_468L
        val era = z.floorDiv(146_097L)
        val doe = z - era * 146_097L
        val yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365
        val y = yoe + era * 400
        val doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
        val mp = (5 * doy + 2) / 153
        val d = (doy - (153 * mp + 2) / 5 + 1).toInt()
        val m = (if (mp < 10) mp + 3 else mp - 9).toInt()
        val anoFinal = (if (m <= 2) y + 1 else y).toInt()
        return Triple(anoFinal, m, d)
    }
}
