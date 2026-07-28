package io.savro.backup

import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.OrigemValor
import io.savro.model.TipoEventoTimeline
import io.savro.model.TipoItemPatrimonial

/**
 * Vetor de teste compartilhado da #121: **os mesmos bytes de entrada e o mesmo resultado esperado**
 * executados nos testes de Android e de iOS.
 *
 * [ARQUIVO_HEX] foi gerado uma única vez pela implementação Android (JVM/JCA) e virou constante.
 * A partir daí:
 * - `oArquivoDeReferenciaAbreNestaPlataforma` prova **Android -> iOS** quando roda no simulador
 *   iOS (o arquivo veio da outra plataforma e precisa abrir aqui);
 * - `regerarOArquivoDeReferenciaProduzOsMesmosBytes` prova **iOS -> Android**: se o iOS gera
 *   exatamente estes bytes com os mesmos parâmetros, então o arquivo que o iOS produz é o mesmo
 *   que o Android já sabe abrir.
 *
 * Qualquer divergência de KDF, de ordem de campos, de escaping ou de codificação de senha entre as
 * duas plataformas quebra um destes dois testes.
 */
object VetoresDeReferencia {

    const val SENHA = "sen#ha-Aç4o-\"forte\""
    const val ITERACOES = 5_000
    const val VERSAO_ESQUEMA = 4
    const val CRIADO_EM_EPOCA_MS = 1_780_123_456_789L

    val SALT: ByteArray = ByteArray(FormatoBackup.TAMANHO_SALT) { (it * 7 + 3).toByte() }
    val NONCE: ByteArray = ByteArray(FormatoBackup.TAMANHO_NONCE) { (it * 11 + 5).toByte() }

    /**
     * Conteúdo com tudo que costuma divergir entre plataformas: acento, aspas, vírgula, quebra de
     * linha, tabulação, barra invertida, emoji, valor negativo (dívida), item arquivado, campos
     * opcionais nulos e preenchidos, três moedas, ajuste e evento.
     */
    fun conteudo(): ConteudoBackup = ConteudoBackup(
        versaoEsquema = VERSAO_ESQUEMA,
        criadoEmEpocaMs = CRIADO_EM_EPOCA_MS,
        itens = listOf(
            ItemPatrimonial(
                id = "item-01",
                tipo = TipoItemPatrimonial.CONTA,
                nome = "Conta corrente — João & Ana",
                valorCentavos = 1_234_567L,
                moeda = "BRL",
                instituicao = "Banco \"Bom\", S.A.",
                observacao = "linha 1\nlinha 2\tcom tab\\barra",
                quantidadeMilesimos = null,
                precoMedioCentavos = null,
                origem = OrigemValor.MANUAL,
                arquivado = false,
                criadoEmEpocaMs = 1_700_000_000_000L,
                atualizadoEmEpocaMs = 1_700_000_500_000L,
            ),
            ItemPatrimonial(
                id = "item-02",
                tipo = TipoItemPatrimonial.RENDA_VARIAVEL,
                nome = "Ação PETR4 🐿️",
                valorCentavos = 987_650L,
                moeda = "USD",
                instituicao = null,
                observacao = null,
                quantidadeMilesimos = 12_500L,
                precoMedioCentavos = 7_901L,
                origem = OrigemValor.MANUAL,
                arquivado = true,
                criadoEmEpocaMs = 1_700_100_000_000L,
                atualizadoEmEpocaMs = 1_700_100_000_000L,
            ),
            ItemPatrimonial(
                id = "item-03",
                tipo = TipoItemPatrimonial.DIVIDA,
                nome = "Financiamento",
                valorCentavos = -5_000_000L,
                moeda = "EUR",
                instituicao = "Créditos Ltda",
                observacao = "",
                quantidadeMilesimos = null,
                precoMedioCentavos = null,
                origem = OrigemValor.MANUAL,
                arquivado = false,
                criadoEmEpocaMs = 1_700_200_000_000L,
                atualizadoEmEpocaMs = 1_700_300_000_000L,
            ),
        ),
        ajustes = listOf(
            AjusteValorItem(
                id = "ajuste-01",
                itemId = "item-01",
                valorCentavosAnterior = 1_000_000L,
                valorCentavosNovo = 1_234_567L,
                origem = OrigemValor.MANUAL,
                dataEpocaMs = 1_700_000_500_000L,
            ),
        ),
        eventos = listOf(
            EventoTimelineItem(
                id = "evento-01",
                itemId = "item-01",
                itemNome = "Conta corrente — João & Ana",
                tipo = TipoEventoTimeline.VALOR_AJUSTADO,
                dataEpocaMs = 1_700_000_500_000L,
            ),
        ),
        preferencias = PreferenciasBackup(timeoutInatividadeMs = 90_000L),
    )

    /**
     * Bytes exatos do arquivo `*.savrobackup` de referência (hexadecimal minúsculo).
     * Não editar à mão: mudar este valor significa mudar o formato do arquivo, o que exige subir
     * `FormatoBackup.VERSAO_FORMATO` e atualizar `documentacao/arquitetura/formato-savrobackup.md`.
     */
    const val ARQUIVO_HEX: String =
        "534156524f424b31000100040100001388010000030a11181f262d343b424950575e656c05101b26313c47525d68737e89" +
        "949faa612d0971c85bef551e03cab270a439207c71803af120c56983ccd3575a7daf917c0cbf9b088445c4b37ee860ffca" +
        "b6c1138788143cf722d61e438d4bfe6f2866a2d2cf7b6d179259a6d59cc22b7d9af2ac45910bbb1b51bbbe5131a6eed178" +
        "fcc6ffb6410281950470ca8a359e9f31328620ce405167540f5cfecb35cf0ce4ddf479883dc474a68c095cae4401287d6c" +
        "523530f46093c0847fdd30ddb571dc5c95a1e9392d3422616bcecff3f0ac9bb29bf6493ab1ca2a8d55e363dc0f81c07d0d" +
        "d14d5fd028e1bd241146eedb5fc6592bea086d5dc8fc80657ace1bf0a59dc587b7a93e01bc04f0ede995a47d165a2c323d" +
        "21f469ec81a70e9cfb855ae436889ce7589da21bffaec0b2c52eb6a3d2539bdd989d225795f7950d2e897b191457b1bf8c" +
        "a7f9578868dd235e968253d209d979b756bfdfb813bc987d603b745c7fd97c4d5a6bfd5e09bf1241c64dbd53e1ab1ee234" +
        "315e3b1b01f707cbd5180b634ea966ef9ea41257dde10c87f219c9d1803ffaf34ef8d360f668da17d2c3a890c4097105fa" +
        "6438749b39478a96e47210a56251461523b74e9d643a43ec13e3660b8b0d10ed8e35e09bd185af425ab6feb7c958404a55" +
        "1c923dd3a7164ac440f4e1732036debd8735bfcb789a9d3764f60d76fe6eeedd68d6796c03dbcf778969623e4a95ece2d3" +
        "0c2fc0f344e573c348dd683acb424339f4ab3ce4c71eaa1c0e304da8dabb9c986312f67d1168cb0201d5e8a01c332ab804" +
        "1907f9e0a41e0395c15ad7cfba7296392d4c314a081c568ea5f70163194ad0d2bd6d9eab6ceb147ee1baeff192a7b2d572" +
        "70dd0544c7b2b8a98521dd9ba9105f8e7667194c35d9332b76be6ddbd8dab899075be9f16a182af71d0000d94936b0d47e" +
        "87efceeb0709aaff26dc6d97744bb28a500790ef75f806cbd746a070f0083e72f536488cb14fce8e5a94c7674dca064f72" +
        "bb5c776011d2dca514555768d6c351e2dc5ab9ce66807c34d31fa676fea0b2d31a563cec4bdd9c170e4d82d2b50d67838c" +
        "2779e95c34941f1f6e9fa04018343cb56d37d3879abb1f96ff274387c1b6876d695c09198fe397618c71f3939de6aea4be" +
        "e2ce258bf72f6c2d64acd605b6b400db88aa2835dbb649ceed4400a8572f35f84ddb15407cedffb6ff877781475bccde20" +
        "2b78d71f77bb018d87cc882464e06bd3dbe44049e54762fd1ffcb86fbc2e4c4125577d3349135382c9e0c6b651b13d5f48" +
        "fb2b623b6c30d842a09e16a4380b8d8b4d1fe9824f6346accf26543bd0feefebb6e3b97baabe862d45c328ddce908ff4d4" +
        "918fea878e0e60cc0f54862d31fb73b60d830f3f5ea2841c07d27fc6cd4603aaac91602a6d82cd719b5708749914c13aa4" +
        "87f511386f0384ed0144571d3f95831e3a1b4cb65bde0dbb0359cb80f33a753f4d43896c15ea2e27c49181c8f7d4928043" +
        "713e0d00ad17788515d2ccd231fd413226da3b6e16fa279145e685766e2546b001aa633bb1f05fc4ba2425293f44e4d28a" +
        "d1728f0cc8476936f10819b2e5b7e186d8970b537e6a281cace5f69afa5c251234f7ac36c3ec5ce72fb5b70909ac4abcf1" +
        "2ef246cac20ee51cb510023dfc25545d6f53c0a573acf9b34cacb6227675179d22ad15aebef425b043eb6eb142218fbc83" +
        "072a70bf5369d574e5fcb96f79d0fefb04a20d856db7ed14f1a8d31b81a951343422fb0eb7fe8d9f14891e5211b61d1b35" +
        "079f8d6f1b3f0b6de551cb44daa42e54851dae8bd0727335fa1a908a51f01d48af03ad313b21bb1f0395206bbf0d090f4f" +
        "8bd79bf022e0a07306326ade3d6f5f25babef9e956fe30206b5cfcf36c7a2310715fba7fc0a2087a729e345eead0d15484" +
        "a452694b02fc5c3145feeb89967bd7f821ab56f496a5284be751049763bcfa702bca6d27ffc5b1f55266cd938c47227dda" +
        "222185b14228a548a95428ae0235c57b20619aa67a2d41b4"
}
