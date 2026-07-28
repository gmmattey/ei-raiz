package io.savro.database

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoEventoTimeline
import io.savro.model.TipoItemPatrimonial

/**
 * Entidade Room — detalhe de infraestrutura, nunca atravessa a fronteira de domínio (ADR-002).
 * Só [io.savro.database.RepositorioItensPatrimoniaisRoom] conhece este tipo; DAO e mapeamento
 * ficam neste mesmo arquivo/pacote.
 */
@Entity(tableName = "itens_patrimoniais")
data class EntidadeItemPatrimonial(
    @PrimaryKey
    val id: String,
    val tipo: String,
    val nome: String,
    @ColumnInfo(name = "valor_centavos")
    val valorCentavos: Long,
    val moeda: String,
    val instituicao: String?,
    val observacao: String?,
    @ColumnInfo(name = "quantidade_milesimos")
    val quantidadeMilesimos: Long?,
    @ColumnInfo(name = "preco_medio_centavos")
    val precoMedioCentavos: Long?,
    val origem: String,
    val arquivado: Boolean,
    @ColumnInfo(name = "criado_em_epoca_ms")
    val criadoEmEpocaMs: Long,
    @ColumnInfo(name = "atualizado_em_epoca_ms")
    val atualizadoEmEpocaMs: Long,
)

/** Histórico append-only de ajustes manuais de valor (issue #119) — nunca editado nem removido. */
@Entity(
    tableName = "ajustes_valor_item",
    foreignKeys = [
        ForeignKey(
            entity = EntidadeItemPatrimonial::class,
            parentColumns = ["id"],
            childColumns = ["item_id"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("item_id")],
)
data class EntidadeAjusteValorItem(
    @PrimaryKey
    val id: String,
    @ColumnInfo(name = "item_id")
    val itemId: String,
    @ColumnInfo(name = "valor_centavos_anterior")
    val valorCentavosAnterior: Long,
    @ColumnInfo(name = "valor_centavos_novo")
    val valorCentavosNovo: Long,
    val origem: String,
    @ColumnInfo(name = "data_epoca_ms")
    val dataEpocaMs: Long,
)

internal fun EntidadeItemPatrimonial.paraModelo(): ItemPatrimonial = ItemPatrimonial(
    id = id,
    tipo = TipoItemPatrimonial.valueOf(tipo),
    nome = nome,
    valorCentavos = valorCentavos,
    moeda = moeda,
    instituicao = instituicao,
    observacao = observacao,
    quantidadeMilesimos = quantidadeMilesimos,
    precoMedioCentavos = precoMedioCentavos,
    origem = OrigemValor.valueOf(origem),
    arquivado = arquivado,
    criadoEmEpocaMs = criadoEmEpocaMs,
    atualizadoEmEpocaMs = atualizadoEmEpocaMs,
)

internal fun ItemPatrimonial.paraEntidade(): EntidadeItemPatrimonial = EntidadeItemPatrimonial(
    id = id,
    tipo = tipo.name,
    nome = nome,
    valorCentavos = valorCentavos,
    moeda = moeda,
    instituicao = instituicao,
    observacao = observacao,
    quantidadeMilesimos = quantidadeMilesimos,
    precoMedioCentavos = precoMedioCentavos,
    origem = origem.name,
    arquivado = arquivado,
    criadoEmEpocaMs = criadoEmEpocaMs,
    atualizadoEmEpocaMs = atualizadoEmEpocaMs,
)

internal fun EntidadeAjusteValorItem.paraModelo(): AjusteValorItem = AjusteValorItem(
    id = id,
    itemId = itemId,
    valorCentavosAnterior = valorCentavosAnterior,
    valorCentavosNovo = valorCentavosNovo,
    origem = OrigemValor.valueOf(origem),
    dataEpocaMs = dataEpocaMs,
)

/** Restauração de backup (#121) — recoloca o ajuste histórico com o mesmo id e a mesma data. */
internal fun AjusteValorItem.paraEntidade(): EntidadeAjusteValorItem = EntidadeAjusteValorItem(
    id = id,
    itemId = itemId,
    valorCentavosAnterior = valorCentavosAnterior,
    valorCentavosNovo = valorCentavosNovo,
    origem = origem.name,
    dataEpocaMs = dataEpocaMs,
)

/** Linha do tempo básica (issue #120) — append-only, nunca editada nem removida (exceto por cascata). */
@Entity(
    tableName = "eventos_timeline_item",
    foreignKeys = [
        ForeignKey(
            entity = EntidadeItemPatrimonial::class,
            parentColumns = ["id"],
            childColumns = ["item_id"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("item_id")],
)
data class EntidadeEventoTimelineItem(
    @PrimaryKey
    val id: String,
    @ColumnInfo(name = "item_id")
    val itemId: String,
    @ColumnInfo(name = "item_nome")
    val itemNome: String,
    val tipo: String,
    @ColumnInfo(name = "data_epoca_ms")
    val dataEpocaMs: Long,
)

internal fun EntidadeEventoTimelineItem.paraModelo(): EventoTimelineItem = EventoTimelineItem(
    id = id,
    itemId = itemId,
    itemNome = itemNome,
    tipo = TipoEventoTimeline.valueOf(tipo),
    dataEpocaMs = dataEpocaMs,
)

/** Restauração de backup (#121) — recoloca o evento com o mesmo id e a mesma data. */
internal fun EventoTimelineItem.paraEntidade(): EntidadeEventoTimelineItem = EntidadeEventoTimelineItem(
    id = id,
    itemId = itemId,
    itemNome = itemNome,
    tipo = tipo.name,
    dataEpocaMs = dataEpocaMs,
)
