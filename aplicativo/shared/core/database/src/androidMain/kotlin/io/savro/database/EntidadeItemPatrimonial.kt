package io.savro.database

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import io.savro.model.ItemPatrimonial
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
    val instituicao: String?,
    val observacao: String?,
    @ColumnInfo(name = "criado_em_epoca_ms")
    val criadoEmEpocaMs: Long,
    @ColumnInfo(name = "atualizado_em_epoca_ms")
    val atualizadoEmEpocaMs: Long,
)

internal fun EntidadeItemPatrimonial.paraModelo(): ItemPatrimonial = ItemPatrimonial(
    id = id,
    tipo = TipoItemPatrimonial.valueOf(tipo),
    nome = nome,
    valorCentavos = valorCentavos,
    instituicao = instituicao,
    observacao = observacao,
    criadoEmEpocaMs = criadoEmEpocaMs,
    atualizadoEmEpocaMs = atualizadoEmEpocaMs,
)

internal fun ItemPatrimonial.paraEntidade(): EntidadeItemPatrimonial = EntidadeItemPatrimonial(
    id = id,
    tipo = tipo.name,
    nome = nome,
    valorCentavos = valorCentavos,
    instituicao = instituicao,
    observacao = observacao,
    criadoEmEpocaMs = criadoEmEpocaMs,
    atualizadoEmEpocaMs = atualizadoEmEpocaMs,
)
