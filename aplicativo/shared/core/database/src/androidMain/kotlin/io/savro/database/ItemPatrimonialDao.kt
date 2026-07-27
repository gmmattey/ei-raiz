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
}
