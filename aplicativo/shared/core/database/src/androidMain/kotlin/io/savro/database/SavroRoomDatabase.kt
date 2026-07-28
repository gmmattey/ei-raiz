package io.savro.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [EntidadeItemPatrimonial::class, EntidadeAjusteValorItem::class, EntidadeEventoTimelineItem::class],
    version = EsquemaSavro.VERSAO_ATUAL,
    exportSchema = true,
)
internal abstract class SavroRoomDatabase : RoomDatabase() {
    abstract fun itemPatrimonialDao(): ItemPatrimonialDao
}

/**
 * Uma [Migration] real por [io.savro.database.DescricaoMigracao] em [EsquemaSavro.migracoes] — o
 * teste de migration (`RoomMigrationTest`) falha se as duas listas saírem de sincronia.
 */
internal val MIGRATION_1_2: Migration = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE itens_patrimoniais ADD COLUMN observacao TEXT")
    }
}

/**
 * Cadastro manual de patrimônio (#119, ver [EsquemaSavro]). `tipo` é remapeado antes de qualquer
 * outra alteração para preservar dados já persistidos pela #180 (schema mínimo original):
 * `INVESTIMENTO -> RENDA_VARIAVEL`, `IMOVEL`/`VEICULO -> BEM`. `CONTA` e `OUTRO` não mudam de
 * nome. `moeda` recebe `'BRL'` como valor por padrão nas linhas existentes (produto brasileiro,
 * sem dado de moeda anterior a esta migration). `origem` recebe `'MANUAL'` — único valor possível
 * até #124/#125 introduzirem outra origem.
 */
internal val MIGRATION_2_3: Migration = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("UPDATE itens_patrimoniais SET tipo = 'RENDA_VARIAVEL' WHERE tipo = 'INVESTIMENTO'")
        db.execSQL("UPDATE itens_patrimoniais SET tipo = 'BEM' WHERE tipo IN ('IMOVEL', 'VEICULO')")

        db.execSQL("ALTER TABLE itens_patrimoniais ADD COLUMN moeda TEXT NOT NULL DEFAULT 'BRL'")
        db.execSQL("ALTER TABLE itens_patrimoniais ADD COLUMN quantidade_milesimos INTEGER")
        db.execSQL("ALTER TABLE itens_patrimoniais ADD COLUMN preco_medio_centavos INTEGER")
        db.execSQL("ALTER TABLE itens_patrimoniais ADD COLUMN origem TEXT NOT NULL DEFAULT 'MANUAL'")
        db.execSQL("ALTER TABLE itens_patrimoniais ADD COLUMN arquivado INTEGER NOT NULL DEFAULT 0")

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS ajustes_valor_item (
              id TEXT NOT NULL PRIMARY KEY,
              item_id TEXT NOT NULL,
              valor_centavos_anterior INTEGER NOT NULL,
              valor_centavos_novo INTEGER NOT NULL,
              origem TEXT NOT NULL,
              data_epoca_ms INTEGER NOT NULL,
              FOREIGN KEY(item_id) REFERENCES itens_patrimoniais(id) ON DELETE CASCADE
            )
            """.trimIndent(),
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS index_ajustes_valor_item_item_id ON ajustes_valor_item(item_id)")
    }
}

/** Linha do tempo básica (#120, ver [EsquemaSavro]). */
internal val MIGRATION_3_4: Migration = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS eventos_timeline_item (
              id TEXT NOT NULL PRIMARY KEY,
              item_id TEXT NOT NULL,
              item_nome TEXT NOT NULL,
              tipo TEXT NOT NULL,
              data_epoca_ms INTEGER NOT NULL,
              FOREIGN KEY(item_id) REFERENCES itens_patrimoniais(id) ON DELETE CASCADE
            )
            """.trimIndent(),
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS index_eventos_timeline_item_item_id ON eventos_timeline_item(item_id)")
    }
}

internal val TODAS_AS_MIGRATIONS_ROOM: Array<Migration> = arrayOf(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
