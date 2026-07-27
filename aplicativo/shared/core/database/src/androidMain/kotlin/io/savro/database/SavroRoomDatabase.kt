package io.savro.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [EntidadeItemPatrimonial::class],
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

internal val TODAS_AS_MIGRATIONS_ROOM: Array<Migration> = arrayOf(MIGRATION_1_2)
