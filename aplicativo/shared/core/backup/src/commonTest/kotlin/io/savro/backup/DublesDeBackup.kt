package io.savro.backup

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais
import io.savro.domain.patrimonio.TransacaoItensPatrimoniais
import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.MetadadosBancoLocal
import io.savro.model.OrigemValor
import io.savro.model.TipoEventoTimeline
import io.savro.model.TipoItemPatrimonial

const val VERSAO_ESQUEMA_DE_TESTE = 4

/** PBKDF2 de produção usa 1,3 milhão de iterações; nos testes o número é irrelevante e caro. */
const val ITERACOES_DE_TESTE = 2_000

class RelogioFixo(var agora: Long = 1_780_000_000_000L) : Relogio {
    override fun agoraEmEpocaMs(): Long = agora
}

/**
 * Cofre em memória com transação real (instantâneo + rollback), suficiente para validar a
 * restauração sem engine física. O comportamento de transação de Room e SQLCipher é coberto
 * separadamente pelo teste de contrato de `:shared:core:database`.
 */
class RepositorioDeTeste(
    val itens: MutableMap<String, ItemPatrimonial> = LinkedHashMap(),
    val ajustes: MutableList<AjusteValorItem> = mutableListOf(),
    val eventos: MutableList<EventoTimelineItem> = mutableListOf(),
) : RepositorioItensPatrimoniais {

    /** Injeta falha no meio da transação, no N-ésimo item inserido (1 = primeiro). */
    var falharNaInsercaoDeNumero: Int? = null

    var falhaDeLeitura: ErroRepositorio? = null

    private var insercoesNaTransacao = 0

    override suspend fun abrir(): Resultado<MetadadosBancoLocal, ErroRepositorio> =
        Resultado.Sucesso(MetadadosBancoLocal(VERSAO_ESQUEMA_DE_TESTE, itens.size))

    override suspend fun fechar() = Unit

    override suspend fun inserir(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> {
        itens[item.id] = item
        return Resultado.Sucesso(item)
    }

    override suspend fun atualizar(item: ItemPatrimonial): Resultado<ItemPatrimonial, ErroRepositorio> {
        itens[item.id] = item
        return Resultado.Sucesso(item)
    }

    override suspend fun excluir(id: String): Resultado<Unit, ErroRepositorio> {
        itens.remove(id)
        return Resultado.Sucesso(Unit)
    }

    override suspend fun buscarPorId(id: String): Resultado<ItemPatrimonial?, ErroRepositorio> =
        Resultado.Sucesso(itens[id])

    override suspend fun listarTodos(): Resultado<List<ItemPatrimonial>, ErroRepositorio> =
        falhaDeLeitura?.let { Resultado.Falha(it) } ?: Resultado.Sucesso(itens.values.toList())

    override suspend fun registrarAjusteDeValor(
        itemId: String,
        novoValorCentavos: Long,
        dataEpocaMs: Long,
    ): Resultado<ItemPatrimonial, ErroRepositorio> =
        Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))

    override suspend fun listarAjustesDeValor(itemId: String): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        Resultado.Sucesso(ajustes.filter { it.itemId == itemId })

    override suspend fun listarTodosOsAjustes(): Resultado<List<AjusteValorItem>, ErroRepositorio> =
        falhaDeLeitura?.let { Resultado.Falha(it) } ?: Resultado.Sucesso(ajustes.toList())

    override suspend fun registrarEventoTimeline(
        itemId: String,
        itemNome: String,
        tipo: TipoEventoTimeline,
        dataEpocaMs: Long,
    ): Resultado<EventoTimelineItem, ErroRepositorio> =
        Resultado.Falha(ErroRepositorio.ItemNaoEncontrado(itemId))

    override suspend fun listarTimeline(itemId: String?): Resultado<List<EventoTimelineItem>, ErroRepositorio> =
        falhaDeLeitura?.let { Resultado.Falha(it) }
            ?: Resultado.Sucesso(if (itemId == null) eventos.toList() else eventos.filter { it.itemId == itemId })

    override suspend fun executarEmTransacao(
        bloco: suspend TransacaoItensPatrimoniais.() -> Unit,
    ): Resultado<Unit, ErroRepositorio> {
        val instantaneoItens = LinkedHashMap(itens)
        val instantaneoAjustes = ajustes.toList()
        val instantaneoEventos = eventos.toList()
        insercoesNaTransacao = 0
        return try {
            TransacaoDeTeste().bloco()
            Resultado.Sucesso(Unit)
        } catch (excecao: Exception) {
            itens.clear()
            itens.putAll(instantaneoItens)
            ajustes.clear()
            ajustes.addAll(instantaneoAjustes)
            eventos.clear()
            eventos.addAll(instantaneoEventos)
            Resultado.Falha(ErroRepositorio.FalhaTransacao(excecao.message ?: "revertida"))
        }
    }

    private inner class TransacaoDeTeste : TransacaoItensPatrimoniais {
        override suspend fun inserir(item: ItemPatrimonial) {
            itens[item.id] = item
        }

        override suspend fun atualizar(item: ItemPatrimonial) {
            itens[item.id] = item
        }

        override suspend fun excluir(id: String) {
            itens.remove(id)
        }

        override suspend fun apagarTudo() {
            eventos.clear()
            ajustes.clear()
            itens.clear()
        }

        override suspend fun inserirItemRestaurado(item: ItemPatrimonial) {
            insercoesNaTransacao++
            if (insercoesNaTransacao == falharNaInsercaoDeNumero) error("falha simulada na restauração")
            itens[item.id] = item
        }

        override suspend fun inserirAjusteRestaurado(ajuste: AjusteValorItem) {
            ajustes += ajuste
        }

        override suspend fun inserirEventoRestaurado(evento: EventoTimelineItem) {
            eventos += evento
        }
    }
}

class PreferenciasDeTeste(var valor: PreferenciasBackup = PreferenciasBackup.PADRAO) : PreferenciasRestauraveis {
    override suspend fun ler(): PreferenciasBackup = valor
    override suspend fun gravar(preferencias: PreferenciasBackup) {
        valor = preferencias
    }
}

class AreaTemporariaDeTeste : AreaTemporariaBackup {
    val arquivos = LinkedHashMap<String, ByteArray>()
    val gravados = mutableListOf<String>()
    var falharAoGravar = false

    override suspend fun gravar(nome: String, conteudo: ByteArray): String {
        if (falharAoGravar) error("sem espaço")
        val caminho = "/tmp/$nome"
        arquivos[caminho] = conteudo.copyOf()
        gravados += caminho
        return caminho
    }

    override suspend fun remover(caminho: String) {
        arquivos.remove(caminho)
    }
}

class ArquivosDoSistemaDeTeste : ArquivosDoSistema {
    var respostaDeSalvar = true
    var falharAoSalvar = false
    var conteudoSelecionado: ByteArray? = null
    var caminhoRecebido: String? = null
    var nomeRecebido: String? = null

    override suspend fun salvar(caminhoTemporario: String, nomeSugerido: String, tipoMime: String): Boolean {
        caminhoRecebido = caminhoTemporario
        nomeRecebido = nomeSugerido
        if (falharAoSalvar) error("seletor indisponível")
        return respostaDeSalvar
    }

    override suspend fun selecionar(tipoMime: String, extensao: String): ByteArray? = conteudoSelecionado
}

fun itemDeTeste(
    id: String,
    nome: String = "Item $id",
    valorCentavos: Long = 123_456L,
    moeda: String = "BRL",
    tipo: TipoItemPatrimonial = TipoItemPatrimonial.CONTA,
    instituicao: String? = "Banco Teste",
    observacao: String? = null,
    arquivado: Boolean = false,
): ItemPatrimonial = ItemPatrimonial(
    id = id,
    tipo = tipo,
    nome = nome,
    valorCentavos = valorCentavos,
    moeda = moeda,
    instituicao = instituicao,
    observacao = observacao,
    quantidadeMilesimos = null,
    precoMedioCentavos = null,
    origem = OrigemValor.MANUAL,
    arquivado = arquivado,
    criadoEmEpocaMs = 1_700_000_000_000L,
    atualizadoEmEpocaMs = 1_700_000_001_000L,
)

fun ajusteDeTeste(id: String, itemId: String): AjusteValorItem = AjusteValorItem(
    id = id,
    itemId = itemId,
    valorCentavosAnterior = 100_00L,
    valorCentavosNovo = 200_00L,
    origem = OrigemValor.MANUAL,
    dataEpocaMs = 1_700_000_002_000L,
)

fun eventoDeTeste(id: String, itemId: String, itemNome: String = "Item $itemId"): EventoTimelineItem =
    EventoTimelineItem(
        id = id,
        itemId = itemId,
        itemNome = itemNome,
        tipo = TipoEventoTimeline.ITEM_CRIADO,
        dataEpocaMs = 1_700_000_003_000L,
    )

fun conteudoDeTeste(
    itens: List<ItemPatrimonial> = listOf(itemDeTeste("a"), itemDeTeste("b")),
    ajustes: List<AjusteValorItem> = listOf(ajusteDeTeste("aj-1", "a")),
    eventos: List<EventoTimelineItem> = listOf(eventoDeTeste("ev-1", "a")),
    preferencias: PreferenciasBackup = PreferenciasBackup.PADRAO,
    criadoEmEpocaMs: Long = 1_780_000_000_000L,
): ConteudoBackup = ConteudoBackup(
    versaoEsquema = VERSAO_ESQUEMA_DE_TESTE,
    criadoEmEpocaMs = criadoEmEpocaMs,
    itens = itens,
    ajustes = ajustes,
    eventos = eventos,
    preferencias = preferencias,
)

fun ByteArray.paraHex(): String {
    val digitos = "0123456789abcdef"
    return buildString(size * 2) {
        this@paraHex.forEach { valor ->
            val inteiro = valor.toInt() and 0xFF
            append(digitos[inteiro shr 4])
            append(digitos[inteiro and 0xF])
        }
    }
}

fun String.hexParaBytes(): ByteArray {
    require(length % 2 == 0) { "hex com tamanho ímpar" }
    return ByteArray(length / 2) { indice ->
        substring(indice * 2, indice * 2 + 2).toInt(16).toByte()
    }
}
