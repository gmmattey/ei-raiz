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
        "534156524f424b31000100040100001388010000030a11181f262d343b424950575e656c05101b26313c47525d68737e" +
        "1b7a90f54fc01acae9fecf2b3ff7ea802f2dd3b16fe71c42ae0a67a47d1c8ef7056cff64dbc1eb26de6b974ff74c1451" +
        "365c2d588a3890bbee2d19d65d522e5919d0bffbcc0e3b07e289e9cb2c0c7d9bb8344ed204d4c3404f1b8686f4945c46" +
        "05399b34a78c66af55579792342f8723ab450aff714def21322a25f3cc926e05ada6b36c6e2109acc1728e3e68398d44" +
        "290cf4cd11231a1ad9bac38bdf4d19212198cb75d27386bb5fbbf5b449ba3cbdb82f77529907c20c04480655245bf1d7" +
        "e4436973e8d93a0db8f74bb6191f51a77183734ed7bf413a5d128bcd7c6539c05cb3d7bc424a2a2b2202df481bd34613" +
        "5842e47dddb56e82603033f362e75615812d216b9e9775ddb3ddde007af5e87b63cffa8d9db521f5e30eb08a7e48fc30" +
        "f06a9b523c74d447dce046dba3208b74109781b55e8f8096aae3b4c40737c1f849ff07ae4f7e53481ef389e4e9244293" +
        "a89fc2978dd1db92bc282146b790c18d91a14d46eaabdf02a86908624ed22641c27b879cc4727a83ee9247cb31f77d1c" +
        "6b72080eea6b29dd14668c57fb4aaee8a654fb2c0de2205abdd56f43cb7fd8bce78f9e48fd0f34227e2b514d177a46f5" +
        "305086a9350463e62a29367eb01477705ed646882907f3b099f61f772b99cee5caea30713b7ac11ca468b57ab32c4ed5" +
        "02e02c0e9b792c70b3c9220fed162fa3f6d9e7d761fc31a51b4bc316db6d6236f0104a7b492454c9e428a2e3e6401075" +
        "2422cc8923c12b2a251081fec8e3196f9f9de152e5246c53de963a7a763933d6af13e7da849a639fe0764c3f4f021346" +
        "b7dbd9de72e28cea5a85583d507660fec18ce5a309e618bf793677c04d1dad714def9ab9ce3004d79acee66dedd7af14" +
        "68ed8f7fa04d8254224959b7ce2bad3069786cd8adcd22a991763c14d093004d0d81fc4f604330361a30df7f8e523509" +
        "a11ff6a7ab7eff614d9add59b9336fff144b739096b52b807188579f68d557b848453f378e8d3d3b59bf843d1f0bce5e" +
        "9cc70a11b4d9cbaecf6c37ffb4ab22ceb9429707306d10b0b808e05d7eda797ad3d80c30ebc934d2aa542717da61769c" +
        "7fb7e0d3dbf08b846bd3293bbe624457ff4c3cb77c62cfab696effda6d529b670ad594381480622cd6eef966dafd4be2" +
        "a0141b8d59b6b5bf4c7add3343a4cfb8e74ce6437e4503f171054091dced2ea9183de7a2230ad34f6282e7d4e0670969" +
        "040a40b4a599f2a20d7ef921117f7f1e68441d4b1ae0e9f6bf1a66ccf67cc376635a07e47931ebb4590cc9e2e5ca75d2" +
        "da01d7cdae15634db7fe190c9278fb1c6f5ec55e85be58c76adc4c7a70466b272c3eb46fb2a201728bcd7930ffc21dfb" +
        "9795dca0d14af7b4882be3ad2b608dcd2cd9d14f044098445448bb4812183adfca591b997ff79c7ded440c70d8f66c99" +
        "041edf0a0483f7ea4b2dccb740da693f23bbe37477771ad1da24ca1a1959ffc10ab143af5c27a7a88a5ef381415d5269" +
        "f3f659b365f532409f7cc4b6cc6529962198a8706cb726120fc9563aa6148523cdc4aa94fb7aa4a55fc5e5e8e23e6ada" +
        "d36ec434939837d061e0caf6c80dc8bca71c1eb16ec236c0c62699f02956f7825292b2064fe68508b4a5dd08e252ab19" +
        "451daa2392fc0bb4ee4de7b01fa6deea7f188ef9590914d9b31503a4dee403e972d1026cc51bbdcfe155fe0d48e94069" +
        "1a55b1d72525b37d63c9af0a4442509ac1a6118da0cf52b5e0645ace03d60e765338ddad8de06998f600672a50cfca71" +
        "5394b6fe17f3642ed4dd96c0c4f289db49dd80e9563f6dea63b93e4a1152a39d57cca9abd28fb14f070cde1fe34374c7" +
        "27a7ad3698470d0c0f764ea53cbe564bbcfb3ff7462da9f9dde55177cfd8416fc1c6e994f3766019f22e6981d3e91c7b" +
        "70087a105add9bc5d5bac909a913b36eba30ad35dbd8fc69b28c8f6b04bef8d5fa"
}
