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
}
