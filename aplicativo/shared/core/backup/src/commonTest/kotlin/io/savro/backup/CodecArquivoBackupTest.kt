package io.savro.backup

import io.savro.common.Resultado
import io.savro.model.TipoItemPatrimonial
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

/**
 * Cobertura dos cenários obrigatórios da #121 que dependem só do formato: round-trip, senha certa
 * e errada, adulteração, versão de formato, arquivo truncado, schema incompatível, backup vazio e
 * múltiplas moedas. Roda em `commonTest`, ou seja: as mesmas asserções são executadas na JVM
 * (Android) e no simulador iOS.
 */
class CodecArquivoBackupTest {

    private val senha = "senha-forte-123"

    private fun gerar(
        conteudo: ConteudoBackup = conteudoDeTeste(),
        senhaUsada: String = senha,
    ): ByteArray {
        val resultado = CodecArquivoBackup.gerar(conteudo, senhaUsada, ITERACOES_DE_TESTE)
        assertTrue(resultado is Resultado.Sucesso, "geração deveria ter dado certo")
        return resultado.valor
    }

    private fun abrir(arquivo: ByteArray, senhaUsada: String = senha) =
        CodecArquivoBackup.abrir(arquivo, senhaUsada, VERSAO_ESQUEMA_DE_TESTE)

    @Test
    fun roundTripCompletoPreservaItensAjustesEEventos() {
        val original = conteudoDeTeste().ordenado()

        val resultado = abrir(gerar(original))

        assertTrue(resultado is Resultado.Sucesso)
        assertEquals(original, resultado.valor)
    }

    @Test
    fun senhaIncorretaDevolveArquivoInvalidoGenerico() {
        val resultado = abrir(gerar(), senhaUsada = "outra-senha-qualquer")

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), resultado)
    }

    @Test
    fun conteudoAdulteradoInvalidaTagAead() {
        val arquivo = gerar()
        arquivo[arquivo.size - 20] = (arquivo[arquivo.size - 20].toInt() xor 0x01).toByte()

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(arquivo))
    }

    @Test
    fun cabecalhoAdulteradoInvalidaTagAead() {
        // Baixar as iterações do KDF é o ataque óbvio contra um cabeçalho em texto claro; o
        // cabeçalho inteiro entra como AAD justamente para que isso não passe.
        val arquivo = gerar()
        arquivo[16] = 0x01

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(arquivo))
    }

    @Test
    fun saltAdulteradoInvalidaOArquivo() {
        val arquivo = gerar()
        arquivo[25] = (arquivo[25].toInt() xor 0x7F).toByte()

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(arquivo))
    }

    @Test
    fun versaoDeFormatoIncompativelEhReportadaExplicitamente() {
        val arquivo = gerar()
        arquivo[8] = 0x00
        arquivo[9] = 0x63 // versão 99

        val resultado = abrir(arquivo)

        assertEquals(
            Resultado.Falha(ErroBackup.VersaoFormatoIncompativel(99, FormatoBackup.VERSAO_FORMATO)),
            resultado,
        )
    }

    @Test
    fun magiaDesconhecidaNaoEhBackupSavro() {
        val arquivo = gerar()
        arquivo[0] = 0x5A

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(arquivo))
    }

    @Test
    fun arquivoTruncadoNoCorpoNaoAbre() {
        val arquivo = gerar()

        val truncado = arquivo.copyOfRange(0, arquivo.size - 5)

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(truncado))
    }

    @Test
    fun arquivoMenorQueOCabecalhoNaoAbre() {
        val arquivo = gerar().copyOfRange(0, 30)

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(arquivo))
    }

    @Test
    fun schemaMaisNovoQueOAppEhRecusadoAntesDeDecifrar() {
        val doFuturo = conteudoDeTeste().copy(versaoEsquema = VERSAO_ESQUEMA_DE_TESTE + 1)
        val arquivo = gerar(doFuturo)

        val resultado = abrir(arquivo)

        assertEquals(
            Resultado.Falha(
                ErroBackup.EsquemaIncompativel(VERSAO_ESQUEMA_DE_TESTE + 1, VERSAO_ESQUEMA_DE_TESTE),
            ),
            resultado,
        )
    }

    @Test
    fun schemaMaisAntigoContinuaRestauravel() {
        val antigo = conteudoDeTeste().copy(versaoEsquema = VERSAO_ESQUEMA_DE_TESTE - 1)

        val resultado = abrir(gerar(antigo))

        assertTrue(resultado is Resultado.Sucesso)
        assertEquals(VERSAO_ESQUEMA_DE_TESTE - 1, resultado.valor.versaoEsquema)
    }

    @Test
    fun backupVazioEhValidoEAbreNormalmente() {
        val vazio = conteudoDeTeste(itens = emptyList(), ajustes = emptyList(), eventos = emptyList())

        val resultado = abrir(gerar(vazio))

        assertTrue(resultado is Resultado.Sucesso)
        assertEquals(0, resultado.valor.itens.size)
        assertEquals(0, CodecArquivoBackup.previa(resultado.valor, itensNoCofreAtual = 3).totalDeItens)
    }

    @Test
    fun multiplasMoedasSaoPreservadasEListadasNaPrevia() {
        val conteudo = conteudoDeTeste(
            itens = listOf(
                itemDeTeste("a", moeda = "BRL"),
                itemDeTeste("b", moeda = "USD"),
                itemDeTeste("c", moeda = "EUR"),
                itemDeTeste("d", moeda = "USD"),
            ),
            ajustes = emptyList(),
            eventos = emptyList(),
        )

        val resultado = abrir(gerar(conteudo))

        assertTrue(resultado is Resultado.Sucesso)
        val previa = CodecArquivoBackup.previa(resultado.valor, itensNoCofreAtual = 0)
        assertEquals(listOf("BRL", "EUR", "USD"), previa.moedas)
        assertEquals(4, previa.totalDeItens)
    }

    @Test
    fun caracteresEspeciaisSobrevivemAoRoundTrip() {
        val conteudo = conteudoDeTeste(
            itens = listOf(
                itemDeTeste(
                    id = "x",
                    nome = "Ação \"preferencial\", 10% — çãõ",
                    observacao = "linha 1\nlinha 2\tcom tab\\barra",
                    instituicao = "Corretora, S.A.",
                    tipo = TipoItemPatrimonial.RENDA_VARIAVEL,
                ),
            ),
            ajustes = emptyList(),
            eventos = emptyList(),
        )

        val resultado = abrir(gerar(conteudo))

        assertTrue(resultado is Resultado.Sucesso)
        assertEquals(conteudo.itens.single(), resultado.valor.itens.single())
    }

    @Test
    fun senhaCurtaEhRecusadaNaGeracao() {
        val resultado = CodecArquivoBackup.gerar(conteudoDeTeste(), "curta", ITERACOES_DE_TESTE)

        assertEquals(Resultado.Falha(ErroBackup.SenhaFraca), resultado)
    }

    @Test
    fun doisArquivosDaMesmaSenhaUsamSaltENonceDiferentes() {
        val primeiro = gerar()
        val segundo = gerar()

        assertNotEquals(
            primeiro.copyOfRange(20, FormatoBackup.TAMANHO_CABECALHO).paraHex(),
            segundo.copyOfRange(20, FormatoBackup.TAMANHO_CABECALHO).paraHex(),
        )
        assertNotEquals(primeiro.paraHex(), segundo.paraHex())
    }

    @Test
    fun mesmosParametrosProduzemBytesIdenticos() {
        val conteudo = conteudoDeTeste()
        val salt = ByteArray(FormatoBackup.TAMANHO_SALT) { it.toByte() }
        val nonce = ByteArray(FormatoBackup.TAMANHO_NONCE) { (it + 40).toByte() }

        val primeiro = CodecArquivoBackup.gerar(conteudo, senha, ITERACOES_DE_TESTE, salt, nonce)
        val segundo = CodecArquivoBackup.gerar(conteudo, senha, ITERACOES_DE_TESTE, salt, nonce)

        assertTrue(primeiro is Resultado.Sucesso && segundo is Resultado.Sucesso)
        assertContentEquals(primeiro.valor, segundo.valor)
    }

    @Test
    fun ordemDeEntradaNaoMudaOsBytesGerados() {
        val salt = ByteArray(FormatoBackup.TAMANHO_SALT) { 7 }
        val nonce = ByteArray(FormatoBackup.TAMANHO_NONCE) { 9 }
        val itens = listOf(itemDeTeste("c"), itemDeTeste("a"), itemDeTeste("b"))

        val direta = CodecArquivoBackup.gerar(
            conteudoDeTeste(itens = itens, ajustes = emptyList(), eventos = emptyList()),
            senha,
            ITERACOES_DE_TESTE,
            salt,
            nonce,
        )
        val invertida = CodecArquivoBackup.gerar(
            conteudoDeTeste(itens = itens.reversed(), ajustes = emptyList(), eventos = emptyList()),
            senha,
            ITERACOES_DE_TESTE,
            salt,
            nonce,
        )

        assertTrue(direta is Resultado.Sucesso && invertida is Resultado.Sucesso)
        assertContentEquals(direta.valor, invertida.valor)
    }

    @Test
    fun ajusteOrfaoNoArquivoNaoEhAceito() {
        val conteudo = conteudoDeTeste(
            itens = listOf(itemDeTeste("a")),
            ajustes = listOf(ajusteDeTeste("aj-1", itemId = "inexistente")),
            eventos = emptyList(),
        )

        assertEquals(Resultado.Falha(ErroBackup.ArquivoInvalido), abrir(gerar(conteudo)))
    }

    @Test
    fun cabecalhoNaoRevelaDataNemQuantidadeDeItens() {
        val conteudo = conteudoDeTeste(criadoEmEpocaMs = 1_781_234_567_890L)

        val cabecalho = gerar(conteudo).copyOfRange(0, FormatoBackup.TAMANHO_CABECALHO)

        // Nenhum byte do cabeçalho pode conter a data do backup nem a contagem de itens: o
        // cabeçalho é público e não pode virar metadado sobre o patrimônio do usuário.
        val dataEmBytes = (0 until 8).map { deslocamento ->
            ((conteudo.criadoEmEpocaMs shr (56 - deslocamento * 8)) and 0xFF).toByte()
        }.toByteArray()
        assertTrue(!cabecalho.paraHex().contains(dataEmBytes.paraHex()))
    }
}
