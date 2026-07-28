package io.savro.backup

import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoEventoTimeline
import io.savro.model.TipoItemPatrimonial

/**
 * Serialização determinística de [ConteudoBackup] (#121): mesmo conteúdo, mesmos bytes, em
 * qualquer plataforma e em qualquer execução. Ordem de chaves e de coleções é fixa (ver
 * [JsonCanonico] e [ConteudoBackup.ordenado]).
 *
 * A leitura é tolerante com campos ausentes que ainda não existiam em versões anteriores do
 * schema (aplica o mesmo padrão das migrations: `moeda = "BRL"`, `origem = MANUAL`,
 * `arquivado = false`) — é isso que permite restaurar um backup de schema mais antigo. Campo
 * presente com tipo errado é recusado, não "consertado".
 */
internal object SerializadorBackup {

    fun serializar(conteudo: ConteudoBackup): ByteArray {
        val ordenado = conteudo.ordenado()
        val documento = ValorJson.Objeto(
            mapOf(
                "versaoEsquema" to ValorJson.Inteiro(ordenado.versaoEsquema.toLong()),
                "criadoEmEpocaMs" to ValorJson.Inteiro(ordenado.criadoEmEpocaMs),
                "itens" to ValorJson.Lista(ordenado.itens.map(::itemParaJson)),
                "ajustes" to ValorJson.Lista(ordenado.ajustes.map(::ajusteParaJson)),
                "eventos" to ValorJson.Lista(ordenado.eventos.map(::eventoParaJson)),
                "preferencias" to ValorJson.Objeto(
                    mapOf(
                        "timeoutInatividadeMs" to ValorJson.Inteiro(ordenado.preferencias.timeoutInatividadeMs),
                    ),
                ),
            ),
        )
        return JsonCanonico.escrever(documento).encodeToByteArray()
    }

    fun desserializar(bytes: ByteArray): ConteudoBackup? {
        val texto = runCatching { bytes.decodeToString(throwOnInvalidSequence = true) }.getOrNull() ?: return null
        val raiz = JsonCanonico.ler(texto)?.objeto() ?: return null

        val versaoEsquema = raiz.campo("versaoEsquema")?.inteiro()?.toInt() ?: return null
        val criadoEmEpocaMs = raiz.campo("criadoEmEpocaMs")?.inteiro() ?: return null
        val itens = raiz.campo("itens")?.lista()?.map { jsonParaItem(it) ?: return null } ?: return null
        val ajustes = raiz.campo("ajustes")?.lista()?.map { jsonParaAjuste(it) ?: return null } ?: emptyList()
        val eventos = raiz.campo("eventos")?.lista()?.map { jsonParaEvento(it) ?: return null } ?: emptyList()
        val preferencias = raiz.campo("preferencias")?.objeto()?.let { objeto ->
            PreferenciasBackup(
                timeoutInatividadeMs = objeto.campo("timeoutInatividadeMs")?.inteiro()
                    ?: PreferenciasBackup.TIMEOUT_INATIVIDADE_MS_PADRAO,
            )
        } ?: PreferenciasBackup.PADRAO

        return ConteudoBackup(
            versaoEsquema = versaoEsquema,
            criadoEmEpocaMs = criadoEmEpocaMs,
            itens = itens,
            ajustes = ajustes,
            eventos = eventos,
            preferencias = preferencias,
        )
    }

    private fun itemParaJson(item: ItemPatrimonial): ValorJson = ValorJson.Objeto(
        mapOf(
            "id" to ValorJson.Texto(item.id),
            "tipo" to ValorJson.Texto(item.tipo.name),
            "nome" to ValorJson.Texto(item.nome),
            "valorCentavos" to ValorJson.Inteiro(item.valorCentavos),
            "moeda" to ValorJson.Texto(item.moeda),
            "instituicao" to item.instituicao.paraJson(),
            "observacao" to item.observacao.paraJson(),
            "quantidadeMilesimos" to item.quantidadeMilesimos.paraJson(),
            "precoMedioCentavos" to item.precoMedioCentavos.paraJson(),
            "origem" to ValorJson.Texto(item.origem.name),
            "arquivado" to ValorJson.Booleano(item.arquivado),
            "criadoEmEpocaMs" to ValorJson.Inteiro(item.criadoEmEpocaMs),
            "atualizadoEmEpocaMs" to ValorJson.Inteiro(item.atualizadoEmEpocaMs),
        ),
    )

    private fun jsonParaItem(valor: ValorJson): ItemPatrimonial? {
        val objeto = valor.objeto() ?: return null
        return ItemPatrimonial(
            id = objeto.campo("id")?.texto() ?: return null,
            tipo = objeto.campo("tipo")?.texto()?.paraTipoItem() ?: return null,
            nome = objeto.campo("nome")?.texto() ?: return null,
            valorCentavos = objeto.campo("valorCentavos")?.inteiro() ?: return null,
            moeda = objeto.campo("moeda")?.texto() ?: "BRL",
            instituicao = objeto.campo("instituicao")?.texto(),
            observacao = objeto.campo("observacao")?.texto(),
            quantidadeMilesimos = objeto.campo("quantidadeMilesimos")?.inteiro(),
            precoMedioCentavos = objeto.campo("precoMedioCentavos")?.inteiro(),
            origem = objeto.campo("origem")?.texto()?.paraOrigem() ?: OrigemValor.MANUAL,
            arquivado = objeto.campo("arquivado")?.booleano() ?: false,
            criadoEmEpocaMs = objeto.campo("criadoEmEpocaMs")?.inteiro() ?: return null,
            atualizadoEmEpocaMs = objeto.campo("atualizadoEmEpocaMs")?.inteiro() ?: return null,
        )
    }

    private fun ajusteParaJson(ajuste: AjusteValorItem): ValorJson = ValorJson.Objeto(
        mapOf(
            "id" to ValorJson.Texto(ajuste.id),
            "itemId" to ValorJson.Texto(ajuste.itemId),
            "valorCentavosAnterior" to ValorJson.Inteiro(ajuste.valorCentavosAnterior),
            "valorCentavosNovo" to ValorJson.Inteiro(ajuste.valorCentavosNovo),
            "origem" to ValorJson.Texto(ajuste.origem.name),
            "dataEpocaMs" to ValorJson.Inteiro(ajuste.dataEpocaMs),
        ),
    )

    private fun jsonParaAjuste(valor: ValorJson): AjusteValorItem? {
        val objeto = valor.objeto() ?: return null
        return AjusteValorItem(
            id = objeto.campo("id")?.texto() ?: return null,
            itemId = objeto.campo("itemId")?.texto() ?: return null,
            valorCentavosAnterior = objeto.campo("valorCentavosAnterior")?.inteiro() ?: return null,
            valorCentavosNovo = objeto.campo("valorCentavosNovo")?.inteiro() ?: return null,
            origem = objeto.campo("origem")?.texto()?.paraOrigem() ?: OrigemValor.MANUAL,
            dataEpocaMs = objeto.campo("dataEpocaMs")?.inteiro() ?: return null,
        )
    }

    private fun eventoParaJson(evento: EventoTimelineItem): ValorJson = ValorJson.Objeto(
        mapOf(
            "id" to ValorJson.Texto(evento.id),
            "itemId" to ValorJson.Texto(evento.itemId),
            "itemNome" to ValorJson.Texto(evento.itemNome),
            "tipo" to ValorJson.Texto(evento.tipo.name),
            "dataEpocaMs" to ValorJson.Inteiro(evento.dataEpocaMs),
        ),
    )

    private fun jsonParaEvento(valor: ValorJson): EventoTimelineItem? {
        val objeto = valor.objeto() ?: return null
        return EventoTimelineItem(
            id = objeto.campo("id")?.texto() ?: return null,
            itemId = objeto.campo("itemId")?.texto() ?: return null,
            itemNome = objeto.campo("itemNome")?.texto() ?: return null,
            tipo = objeto.campo("tipo")?.texto()?.paraTipoEvento() ?: return null,
            dataEpocaMs = objeto.campo("dataEpocaMs")?.inteiro() ?: return null,
        )
    }

    private fun String?.paraJson(): ValorJson = this?.let { ValorJson.Texto(it) } ?: ValorJson.Nulo

    private fun Long?.paraJson(): ValorJson = this?.let { ValorJson.Inteiro(it) } ?: ValorJson.Nulo

    private fun String.paraTipoItem(): TipoItemPatrimonial? =
        TipoItemPatrimonial.entries.firstOrNull { it.name == this }

    private fun String.paraTipoEvento(): TipoEventoTimeline? =
        TipoEventoTimeline.entries.firstOrNull { it.name == this }

    private fun String.paraOrigem(): OrigemValor? = OrigemValor.entries.firstOrNull { it.name == this }
}
