package io.savro.database

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.GeradorIdItem
import io.savro.domain.patrimonio.ProvedorChaveMestra
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.domain.patrimonio.TransacaoItensPatrimoniais
import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
import io.savro.model.OrigemValor
import io.savro.model.TipoEventoTimeline
import io.savro.model.TipoItemPatrimonial
import kotlin.concurrent.Volatile
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Implementação iOS de [RepositorioItensPatrimoniais]: SQLCipher nativo via cinterop
 * ([SQLiteCifrado]), schema/migrations espelhando 1:1 [SavroRoomDatabase] do Android — mesmo
 * formato lógico (ADR-002, "Persistência cifrada multiplataforma"), engines físicas diferentes.
 *
 * Ver aviso de risco em [SQLiteCifrado] — esta classe herda a mesma pendência de validação (CI
 * macOS, não compilada localmente).
 */
class RepositorioItensPatrimoniaisSQLCipher(
    private val provedorChaveMestra: ProvedorChaveMestra,
    private val relogio: Relogio,
    private val nomeArquivoBanco: String = EsquemaSavro.NOME_BANCO,
    private val caminhoPersonalizado: String? = null,
) : RepositorioItensPatrimoniais {

    private val mutex = Mutex()

    @Volatile
    private var banco: SQLiteCifrado? = null

    override suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio> = mutex.withLock {
        banco?.let {
            return@withLock Resultado.Sucesso(MetadadosBancoLocal(EsquemaSavro.VERSAO_ATUAL, contar(it)))
        }

        when (val resultadoChave = provedorChaveMestra.obterOuCriarChave()) {
            is Resultado.Falha -> Resultado.Falha(resultadoChave.erro)
            is Resultado.Sucesso -> abrirComChave(resultadoChave.valor)
        }
    }

    private fun abrirComChave(chave: ByteArray): Resultado<MetadadosBancoLocal, ErroRepositorio> {
        val caminho = caminhoPersonalizado ?: SQLiteCifrado.caminhoPadrao(nomeArquivoBanco)
        return try {
            val instancia = SQLiteCifrado.abrir(caminho, chave)
            try {
                // Achado ao implementar a #120 (timeline): `PRAGMA foreign_keys` nunca era
                // habilitado nesta conexão — sem isso, `ON DELETE CASCADE` (já declarado desde a
                // #119 em `ajustes_valor_item`, e agora também em `eventos_timeline_item`) nunca
                // era aplicado de verdade no iOS; SQLite trata FK como só-documentação por padrão
                // até este pragma ser executado em cada conexão. Precisa vir antes de qualquer
                // outra operação na conexão.
                instancia.executar("PRAGMA foreign_keys = ON")
                aplicarSchemaEMigrations(instancia)
                // Correção #130 (decisão do Luiz): exclui savro.db e seus sidecars do backup
                // automático do sistema (iCloud/iTunes) — best-effort, nunca falha a abertura do
                // cofre. Ver ExclusaoBackupAutomaticoIOS.kt.
                excluirBancoDoBackupAutomatico(caminho)
                val total = contar(instancia)
                banco = instancia
                Resultado.Sucesso(MetadadosBancoLocal(EsquemaSavro.VERSAO_ATUAL, total))
            } catch (excecao: Exception) {
                instancia.fechar()
                mapearExcecaoDeAbertura(excecao)
            }
        } catch (excecao: Exception) {
            mapearExcecaoDeAbertura(excecao)
        } finally {
            chave.fill(0)
        }
    }

    override suspend fun fechar() {
        mutex.withLock {
            banco?.fechar()
            banco = null
        }
    }

    override suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        comBancoAberto { db ->
            val agora = relogio.agoraEmEpocaMs()
            val itemComTimestamps = item.copy(criadoEmEpocaMs = agora, atualizadoEmEpocaMs = agora)
            db.executar(sqlInserir(itemComTimestamps))
            Resultado.Sucesso(itemComTimestamps)
        }

    override suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> =
        comBancoAberto { db ->
            val itemAtualizado = item.copy(atualizadoEmEpocaMs = relogio.agoraEmEpocaMs())
            db.executar(sqlAtualizar(itemAtualizado))
            if (db.linhasAfetadas() == 0) {
                Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(item.id))
            } else {
                Resultado.Sucesso(itemAtualizado)
            }
        }

    override suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio> = comBancoAberto { db ->
        db.executar("DELETE FROM itens_patrimoniais WHERE id = '${id.escapado()}'")
        if (db.linhasAfetadas() == 0) {
            Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(id))
        } else {
            Resultado.Sucesso(Unit)
        }
    }

    override suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio> =
        comBancoAberto { db ->
            val linhas = db.consultar("SELECT * FROM itens_patrimoniais WHERE id = '${id.escapado()}' LIMIT 1")
            Resultado.Sucesso(linhas.firstOrNull()?.let(::linhaParaItem))
        }

    override suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio> =
        comBancoAberto { db ->
            val linhas = db.consultar("SELECT * FROM itens_patrimoniais ORDER BY criado_em_epoca_ms ASC")
            Resultado.Sucesso(linhas.map(::linhaParaItem))
        }

    override suspend fun registrarAjusteDeValor(
        itemId: String,
        novoValorCentavos: Long,
        dataEpocaMs: Long,
    ): Resultado<ItemPatrimonial, ErroRepositorio> = comBancoAberto { db ->
        val existente = db.consultar("SELECT * FROM itens_patrimoniais WHERE id = '${itemId.escapado()}' LIMIT 1")
            .firstOrNull()?.let(::linhaParaItem)
            ?: return@comBancoAberto Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))

        db.executar("BEGIN IMMEDIATE")
        try {
            db.executar(
                """
                INSERT INTO ajustes_valor_item
                    (id, item_id, valor_centavos_anterior, valor_centavos_novo, origem, data_epoca_ms)
                VALUES (
                    '${GeradorIdItem.novoId().escapado()}',
                    '${itemId.escapado()}',
                    ${existente.valorCentavos},
                    $novoValorCentavos,
                    '${existente.origem.name}',
                    $dataEpocaMs
                )
                """.trimIndent(),
            )
            db.executar(
                "UPDATE itens_patrimoniais SET valor_centavos = $novoValorCentavos, " +
                    "atualizado_em_epoca_ms = $dataEpocaMs WHERE id = '${itemId.escapado()}'",
            )
            db.executar("COMMIT")
            Resultado.Sucesso(existente.copy(valorCentavos = novoValorCentavos, atualizadoEmEpocaMs = dataEpocaMs))
        } catch (excecao: Exception) {
            runCatching { db.executar("ROLLBACK") }
            Resultado.Falha(ErroRepositorio.FalhaTransacao(excecao.message ?: "Transação revertida"))
        }
    }

    override suspend fun listarAjustesDeValor(itemId: String): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        comBancoAberto { db ->
            val linhas = db.consultar(
                "SELECT * FROM ajustes_valor_item WHERE item_id = '${itemId.escapado()}' ORDER BY data_epoca_ms ASC",
            )
            Resultado.Sucesso(linhas.map(::linhaParaAjuste))
        }

    override suspend fun listarTodosOsAjustes(): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        comBancoAberto { db ->
            val linhas = db.consultar("SELECT * FROM ajustes_valor_item ORDER BY data_epoca_ms ASC")
            Resultado.Sucesso(linhas.map(::linhaParaAjuste))
        }

    override suspend fun registrarEventoTimeline(
        itemId: String,
        itemNome: String,
        tipo: TipoEventoTimeline,
        dataEpocaMs: Long,
    ): Resultado<EventoTimelineItem, ErroRepositorio> = comBancoAberto { db ->
        val evento = EventoTimelineItem(
            id = GeradorIdItem.novoId(),
            itemId = itemId,
            itemNome = itemNome,
            tipo = tipo,
            dataEpocaMs = dataEpocaMs,
        )
        db.executar(
            """
            INSERT INTO eventos_timeline_item (id, item_id, item_nome, tipo, data_epoca_ms)
            VALUES (
                '${evento.id.escapado()}',
                '${itemId.escapado()}',
                '${itemNome.escapado()}',
                '${tipo.name}',
                $dataEpocaMs
            )
            """.trimIndent(),
        )
        Resultado.Sucesso(evento)
    }

    override suspend fun listarTimeline(itemId: String?): Resultado<List<EventoTimelineItem>, ErroRepositorio> =
        comBancoAberto { db ->
            val sql = if (itemId == null) {
                "SELECT * FROM eventos_timeline_item ORDER BY data_epoca_ms DESC"
            } else {
                "SELECT * FROM eventos_timeline_item WHERE item_id = '${itemId.escapado()}' ORDER BY data_epoca_ms DESC"
            }
            Resultado.Sucesso(db.consultar(sql).map(::linhaParaEventoTimeline))
        }

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> {
        val instancia = banco ?: return Resultado.Falha(
            ErroRepositorio.FalhaAbertura("Repositório chamado antes de abrir()"),
        )
        instancia.executar("BEGIN IMMEDIATE")
        return try {
            TransacaoItensPatrimoniaisSQLCipher(instancia, relogio).bloco()
            instancia.executar("COMMIT")
            Resultado.Sucesso(Unit)
        } catch (excecao: Exception) {
            runCatching { instancia.executar("ROLLBACK") }
            Resultado.Falha(ErroRepositorio.FalhaTransacao(excecao.message ?: "Transação revertida"))
        }
    }

    private inline fun <T> comBancoAberto(
        operacao: (SQLiteCifrado) -> Resultado<T, ErroRepositorio>,
    ): Resultado<T, ErroRepositorio> {
        val instancia = banco ?: return Resultado.Falha(
            ErroRepositorio.FalhaAbertura("Repositório chamado antes de abrir()"),
        )
        return operacao(instancia)
    }

    private fun contar(db: SQLiteCifrado): Int =
        db.consultar("SELECT COUNT(*) AS total FROM itens_patrimoniais").firstOrNull()
            ?.get("total")?.toIntOrNull() ?: 0

    /**
     * `PRAGMA user_version` guarda a versão do schema — equivalente lógico ao mecanismo de
     * versão do Room, mas nativo do SQLite/SQLCipher. Uma migration real por
     * [EsquemaSavro.migracoes]; hoje só existe 1→2.
     */
    private fun aplicarSchemaEMigrations(db: SQLiteCifrado) {
        val versaoAtual = db.consultar("PRAGMA user_version").firstOrNull()
            ?.get("user_version")?.toIntOrNull() ?: 0

        if (versaoAtual == 0) {
            db.executar(
                """
                CREATE TABLE IF NOT EXISTS itens_patrimoniais (
                  id TEXT NOT NULL PRIMARY KEY,
                  tipo TEXT NOT NULL,
                  nome TEXT NOT NULL,
                  valor_centavos INTEGER NOT NULL,
                  moeda TEXT NOT NULL DEFAULT 'BRL',
                  instituicao TEXT,
                  observacao TEXT,
                  quantidade_milesimos INTEGER,
                  preco_medio_centavos INTEGER,
                  origem TEXT NOT NULL DEFAULT 'MANUAL',
                  arquivado INTEGER NOT NULL DEFAULT 0,
                  criado_em_epoca_ms INTEGER NOT NULL,
                  atualizado_em_epoca_ms INTEGER NOT NULL
                )
                """.trimIndent(),
            )
            criarTabelaDeAjustes(db)
            criarTabelaDeTimeline(db)
            db.executar("PRAGMA user_version = ${EsquemaSavro.VERSAO_ATUAL}")
            return
        }

        if (versaoAtual < EsquemaSavro.VERSAO_ATUAL) {
            if (versaoAtual < 2) {
                db.executar("ALTER TABLE itens_patrimoniais ADD COLUMN observacao TEXT")
            }
            if (versaoAtual < 3) {
                // Cadastro manual de patrimônio (#119). Mesmo remapeamento de dados que a
                // migration 2->3 do Android (MIGRATION_2_3 em SavroRoomDatabase.kt) — ver
                // comentário lá para o motivo de cada remapeamento.
                db.executar("UPDATE itens_patrimoniais SET tipo = 'RENDA_VARIAVEL' WHERE tipo = 'INVESTIMENTO'")
                db.executar("UPDATE itens_patrimoniais SET tipo = 'BEM' WHERE tipo IN ('IMOVEL', 'VEICULO')")
                db.executar("ALTER TABLE itens_patrimoniais ADD COLUMN moeda TEXT NOT NULL DEFAULT 'BRL'")
                db.executar("ALTER TABLE itens_patrimoniais ADD COLUMN quantidade_milesimos INTEGER")
                db.executar("ALTER TABLE itens_patrimoniais ADD COLUMN preco_medio_centavos INTEGER")
                db.executar("ALTER TABLE itens_patrimoniais ADD COLUMN origem TEXT NOT NULL DEFAULT 'MANUAL'")
                db.executar("ALTER TABLE itens_patrimoniais ADD COLUMN arquivado INTEGER NOT NULL DEFAULT 0")
                criarTabelaDeAjustes(db)
            }
            if (versaoAtual < 4) {
                // Linha do tempo básica (#120). Mesma tabela que a migration 3->4 do Android
                // (MIGRATION_3_4 em SavroRoomDatabase.kt).
                criarTabelaDeTimeline(db)
            }
            db.executar("PRAGMA user_version = ${EsquemaSavro.VERSAO_ATUAL}")
        }
    }

    private fun criarTabelaDeAjustes(db: SQLiteCifrado) {
        db.executar(
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
        db.executar("CREATE INDEX IF NOT EXISTS index_ajustes_valor_item_item_id ON ajustes_valor_item(item_id)")
    }

    private fun criarTabelaDeTimeline(db: SQLiteCifrado) {
        db.executar(
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
        db.executar("CREATE INDEX IF NOT EXISTS index_eventos_timeline_item_item_id ON eventos_timeline_item(item_id)")
    }

    private fun mapearExcecaoDeAbertura(excecao: Exception): Resultado<MetadadosBancoLocal, ErroRepositorio> {
        val mensagem = excecao.message?.lowercase().orEmpty()
        return if ("encrypted" in mensagem || "not a database" in mensagem) {
            Resultado.Falha(ErroRepositorio.ChaveInvalida("Chave incorreta ou arquivo corrompido"))
        } else {
            Resultado.Falha(ErroRepositorio.FalhaAbertura(excecao.message ?: excecao.toString()))
        }
    }

    private class TransacaoItensPatrimoniaisSQLCipher(
        private val db: SQLiteCifrado,
        private val relogio: Relogio,
    ) : TransacaoItensPatrimoniais {
        override suspend fun inserir(item: ItemPatrimonial) {
            val agora = relogio.agoraEmEpocaMs()
            db.executar(sqlInserir(item.copy(criadoEmEpocaMs = agora, atualizadoEmEpocaMs = agora)))
        }

        override suspend fun atualizar(item: ItemPatrimonial) {
            db.executar(sqlAtualizar(item.copy(atualizadoEmEpocaMs = relogio.agoraEmEpocaMs())))
            check(db.linhasAfetadas() > 0) { "Item '${item.id}' não encontrado na transação" }
        }

        override suspend fun excluir(id: String) {
            db.executar("DELETE FROM itens_patrimoniais WHERE id = '${id.escapado()}'")
            check(db.linhasAfetadas() > 0) { "Item '$id' não encontrado na transação" }
        }

        // Restauração por substituição total (#121) — mesma ordem explícita do Android
        // (eventos, ajustes, itens), independente de `PRAGMA foreign_keys`.
        override suspend fun apagarTudo() {
            db.executar("DELETE FROM eventos_timeline_item")
            db.executar("DELETE FROM ajustes_valor_item")
            db.executar("DELETE FROM itens_patrimoniais")
        }

        override suspend fun inserirItemRestaurado(item: ItemPatrimonial) {
            db.executar(sqlInserir(item))
        }

        override suspend fun inserirAjusteRestaurado(ajuste: AjusteValorItem) {
            db.executar(
                """
                INSERT INTO ajustes_valor_item
                    (id, item_id, valor_centavos_anterior, valor_centavos_novo, origem, data_epoca_ms)
                VALUES (
                    '${ajuste.id.escapado()}',
                    '${ajuste.itemId.escapado()}',
                    ${ajuste.valorCentavosAnterior},
                    ${ajuste.valorCentavosNovo},
                    '${ajuste.origem.name}',
                    ${ajuste.dataEpocaMs}
                )
                """.trimIndent(),
            )
        }

        override suspend fun inserirEventoRestaurado(evento: EventoTimelineItem) {
            db.executar(
                """
                INSERT INTO eventos_timeline_item (id, item_id, item_nome, tipo, data_epoca_ms)
                VALUES (
                    '${evento.id.escapado()}',
                    '${evento.itemId.escapado()}',
                    '${evento.itemNome.escapado()}',
                    '${evento.tipo.name}',
                    ${evento.dataEpocaMs}
                )
                """.trimIndent(),
            )
        }
    }
}

private fun String.escapado(): String = replace("'", "''")

private fun linhaParaItem(linha: Map<String, String?>): ItemPatrimonial = ItemPatrimonial(
    id = linha.getValue("id") ?: error("linha sem id"),
    tipo = TipoItemPatrimonial.valueOf(linha.getValue("tipo") ?: error("linha sem tipo")),
    nome = linha.getValue("nome") ?: error("linha sem nome"),
    valorCentavos = linha.getValue("valor_centavos")?.toLong() ?: 0,
    moeda = linha["moeda"] ?: "BRL",
    instituicao = linha["instituicao"],
    observacao = linha["observacao"],
    quantidadeMilesimos = linha["quantidade_milesimos"]?.toLongOrNull(),
    precoMedioCentavos = linha["preco_medio_centavos"]?.toLongOrNull(),
    origem = linha["origem"]?.let { runCatching { OrigemValor.valueOf(it) }.getOrNull() } ?: OrigemValor.MANUAL,
    arquivado = linha["arquivado"] == "1",
    criadoEmEpocaMs = linha.getValue("criado_em_epoca_ms")?.toLong() ?: 0,
    atualizadoEmEpocaMs = linha.getValue("atualizado_em_epoca_ms")?.toLong() ?: 0,
)

private fun linhaParaAjuste(linha: Map<String, String?>): AjusteValorItem = AjusteValorItem(
    id = linha.getValue("id") ?: error("linha sem id"),
    itemId = linha.getValue("item_id") ?: error("linha sem item_id"),
    valorCentavosAnterior = linha.getValue("valor_centavos_anterior")?.toLong() ?: 0,
    valorCentavosNovo = linha.getValue("valor_centavos_novo")?.toLong() ?: 0,
    origem = linha["origem"]?.let { runCatching { OrigemValor.valueOf(it) }.getOrNull() } ?: OrigemValor.MANUAL,
    dataEpocaMs = linha.getValue("data_epoca_ms")?.toLong() ?: 0,
)

private fun linhaParaEventoTimeline(linha: Map<String, String?>): EventoTimelineItem = EventoTimelineItem(
    id = linha.getValue("id") ?: error("linha sem id"),
    itemId = linha.getValue("item_id") ?: error("linha sem item_id"),
    itemNome = linha.getValue("item_nome") ?: error("linha sem item_nome"),
    tipo = TipoEventoTimeline.valueOf(linha.getValue("tipo") ?: error("linha sem tipo")),
    dataEpocaMs = linha.getValue("data_epoca_ms")?.toLong() ?: 0,
)

private fun sqlInserir(item: ItemPatrimonial): String = """
    INSERT INTO itens_patrimoniais
        (id, tipo, nome, valor_centavos, moeda, instituicao, observacao, quantidade_milesimos,
         preco_medio_centavos, origem, arquivado, criado_em_epoca_ms, atualizado_em_epoca_ms)
    VALUES (
        '${item.id.escapado()}',
        '${item.tipo.name}',
        '${item.nome.escapado()}',
        ${item.valorCentavos},
        '${item.moeda.escapado()}',
        ${item.instituicao?.let { "'${it.escapado()}'" } ?: "NULL"},
        ${item.observacao?.let { "'${it.escapado()}'" } ?: "NULL"},
        ${item.quantidadeMilesimos ?: "NULL"},
        ${item.precoMedioCentavos ?: "NULL"},
        '${item.origem.name}',
        ${if (item.arquivado) 1 else 0},
        ${item.criadoEmEpocaMs},
        ${item.atualizadoEmEpocaMs}
    )
""".trimIndent()

private fun sqlAtualizar(item: ItemPatrimonial): String = """
    UPDATE itens_patrimoniais SET
        tipo = '${item.tipo.name}',
        nome = '${item.nome.escapado()}',
        valor_centavos = ${item.valorCentavos},
        moeda = '${item.moeda.escapado()}',
        instituicao = ${item.instituicao?.let { "'${it.escapado()}'" } ?: "NULL"},
        observacao = ${item.observacao?.let { "'${it.escapado()}'" } ?: "NULL"},
        quantidade_milesimos = ${item.quantidadeMilesimos ?: "NULL"},
        preco_medio_centavos = ${item.precoMedioCentavos ?: "NULL"},
        arquivado = ${if (item.arquivado) 1 else 0},
        atualizado_em_epoca_ms = ${item.atualizadoEmEpocaMs}
    WHERE id = '${item.id.escapado()}'
""".trimIndent()
