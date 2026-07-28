package io.savro.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
internal interface ItemPatrimonialDao {

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun inserir(entidade: EntidadeItemPatrimonial)

    /** Retorna quantas linhas foram atualizadas — 0 significa "id não encontrado". */
    @Update
    suspend fun atualizar(entidade: EntidadeItemPatrimonial): Int

    /** Retorna quantas linhas foram removidas — 0 significa "id não encontrado". */
    @Query("DELETE FROM itens_patrimoniais WHERE id = :id")
    suspend fun excluir(id: String): Int

    @Query("SELECT * FROM itens_patrimoniais WHERE id = :id")
    suspend fun buscarPorId(id: String): EntidadeItemPatrimonial?

    @Query("SELECT * FROM itens_patrimoniais ORDER BY criado_em_epoca_ms ASC")
    suspend fun listarTodos(): List<EntidadeItemPatrimonial>

    @Query("SELECT COUNT(*) FROM itens_patrimoniais")
    suspend fun contar(): Int

    @Query("UPDATE itens_patrimoniais SET valor_centavos = :valorCentavos, atualizado_em_epoca_ms = :dataEpocaMs WHERE id = :id")
    suspend fun atualizarValor(id: String, valorCentavos: Long, dataEpocaMs: Long): Int

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun inserirAjuste(entidade: EntidadeAjusteValorItem)

    @Query("SELECT * FROM ajustes_valor_item WHERE item_id = :itemId ORDER BY data_epoca_ms ASC")
    suspend fun listarAjustes(itemId: String): List<EntidadeAjusteValorItem>

    /** Retrato completo dos ajustes para o backup (#121). */
    @Query("SELECT * FROM ajustes_valor_item ORDER BY data_epoca_ms ASC")
    suspend fun listarTodosOsAjustes(): List<EntidadeAjusteValorItem>

    // Restauração por substituição total (#121). A ordem de chamada importa: eventos e ajustes
    // primeiro, itens depois — apagar itens antes dispararia o ON DELETE CASCADE e o resultado
    // seria o mesmo, mas a ordem explícita mantém o comportamento igual ao do iOS, onde
    // `PRAGMA foreign_keys` pode estar habilitado ou não.
    @Query("DELETE FROM eventos_timeline_item")
    suspend fun apagarEventosTimeline()

    @Query("DELETE FROM ajustes_valor_item")
    suspend fun apagarAjustes()

    @Query("DELETE FROM itens_patrimoniais")
    suspend fun apagarItens()

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun inserirEventoTimeline(entidade: EntidadeEventoTimelineItem)

    @Query("SELECT * FROM eventos_timeline_item ORDER BY data_epoca_ms DESC")
    suspend fun listarTimelineGlobal(): List<EntidadeEventoTimelineItem>

    @Query("SELECT * FROM eventos_timeline_item WHERE item_id = :itemId ORDER BY data_epoca_ms DESC")
    suspend fun listarTimelineDoItem(itemId: String): List<EntidadeEventoTimelineItem>
}
