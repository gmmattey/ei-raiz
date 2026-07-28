package io.savro.backup

import io.savro.common.Resultado

/**
 * Escreve e lê o arquivo `*.savrobackup` inteiro (#121) — a única implementação do formato,
 * compartilhada pelas duas plataformas. Nada aqui conhece banco, tela, arquivo em disco ou
 * plataforma: entra/sai `ByteArray`.
 */
object CodecArquivoBackup {

    /**
     * Gera o arquivo. [salt] e [nonce] são parâmetros para os testes de vetor conseguirem
     * reproduzir bytes exatos; em produção ficam `null` e vêm do gerador seguro do sistema —
     * **nonce novo a cada arquivo**, nunca reaproveitado com a mesma chave (requisito do GCM).
     */
    fun gerar(
        conteudo: ConteudoBackup,
        senha: String,
        iteracoesKdf: Int = FormatoBackup.ITERACOES_PADRAO,
        salt: ByteArray? = null,
        nonce: ByteArray? = null,
    ): Resultado<ByteArray, ErroBackup> {
        if (senha.length < FormatoBackup.TAMANHO_MINIMO_SENHA) {
            return Resultado.Falha(ErroBackup.SenhaFraca)
        }

        val cabecalho = CabecalhoBackup(
            versaoFormato = FormatoBackup.VERSAO_FORMATO,
            versaoEsquema = conteudo.versaoEsquema,
            idKdf = FormatoBackup.ID_KDF_PBKDF2_HMAC_SHA1,
            iteracoesKdf = iteracoesKdf,
            idCifra = FormatoBackup.ID_CIFRA_AES_256_GCM,
            salt = salt ?: CriptografiaBackup.bytesAleatorios(FormatoBackup.TAMANHO_SALT),
            nonce = nonce ?: CriptografiaBackup.bytesAleatorios(FormatoBackup.TAMANHO_NONCE),
        )
        val cabecalhoBytes = cabecalho.paraBytes()
        val corpo = SerializadorBackup.serializar(conteudo)
        val chave = derivarChave(senha, cabecalho)
        return try {
            val cifra = CriptografiaBackup.cifrar(chave, cabecalho.nonce, cabecalhoBytes, corpo)
            Resultado.Sucesso(cabecalhoBytes + cifra)
        } finally {
            chave.fill(0)
            corpo.fill(0)
        }
    }

    /**
     * Valida cabeçalho, versão de formato, versão de schema, integridade (tag AEAD) e senha —
     * nesta ordem e **antes** de qualquer escrita no banco (issue #121). Não toca em persistência:
     * quem restaura é [ServicoBackup], depois de o usuário confirmar a prévia.
     */
    fun abrir(
        arquivo: ByteArray,
        senha: String,
        versaoEsquemaSuportada: Int,
    ): Resultado<ConteudoBackup, ErroBackup> {
        val cabecalho = when (val lido = CabecalhoBackup.ler(arquivo, versaoEsquemaSuportada)) {
            is Resultado.Falha -> return Resultado.Falha(lido.erro)
            is Resultado.Sucesso -> lido.valor
        }

        val chave = derivarChave(senha, cabecalho)
        val corpo = try {
            CriptografiaBackup.decifrar(
                chave = chave,
                nonce = cabecalho.nonce,
                dadosAutenticados = arquivo.copyOfRange(0, FormatoBackup.TAMANHO_CABECALHO),
                cifra = arquivo.copyOfRange(FormatoBackup.TAMANHO_CABECALHO, arquivo.size),
            )
        } finally {
            chave.fill(0)
        } ?: return Resultado.Falha(ErroBackup.ArquivoInvalido)

        val conteudo = try {
            SerializadorBackup.desserializar(corpo)
        } finally {
            corpo.fill(0)
        } ?: return Resultado.Falha(ErroBackup.ArquivoInvalido)

        // Cabeçalho e corpo declaram a mesma versão de schema; divergência só acontece em arquivo
        // manipulado (a tag já garantiria isso, mas a checagem é barata e explícita).
        if (conteudo.versaoEsquema != cabecalho.versaoEsquema) {
            return Resultado.Falha(ErroBackup.ArquivoInvalido)
        }
        if (!referenciasConsistentes(conteudo)) {
            return Resultado.Falha(ErroBackup.ArquivoInvalido)
        }
        return Resultado.Sucesso(conteudo)
    }

    /** Prévia sem restaurar nada (issue #121: confirmar antes de aplicar). */
    fun previa(conteudo: ConteudoBackup, itensNoCofreAtual: Int): PreviaBackup = PreviaBackup(
        versaoFormato = FormatoBackup.VERSAO_FORMATO,
        versaoEsquema = conteudo.versaoEsquema,
        criadoEmEpocaMs = conteudo.criadoEmEpocaMs,
        totalDeItens = conteudo.itens.size,
        totalDeAjustes = conteudo.ajustes.size,
        totalDeEventos = conteudo.eventos.size,
        moedas = conteudo.itens.map { it.moeda }.distinct().sorted(),
        itensNoCofreAtual = itensNoCofreAtual,
    )

    private fun derivarChave(senha: String, cabecalho: CabecalhoBackup): ByteArray =
        CriptografiaBackup.derivarChave(
            senhaAscii = CodificadorSenha.paraAsciiHex(senha),
            salt = cabecalho.salt,
            iteracoes = cabecalho.iteracoesKdf,
            tamanhoBytes = FormatoBackup.TAMANHO_CHAVE,
        )

    /**
     * Ajuste ou evento apontando para um item que não está no backup quebraria a FK na restauração
     * e derrubaria a transação inteira no meio. Recusar aqui, antes de tocar no banco, mantém a
     * promessa de que arquivo inválido nunca altera o cofre atual.
     */
    private fun referenciasConsistentes(conteudo: ConteudoBackup): Boolean {
        val ids = conteudo.itens.map { it.id }.toHashSet()
        if (ids.size != conteudo.itens.size) return false
        if (conteudo.ajustes.any { it.itemId !in ids }) return false
        if (conteudo.eventos.any { it.itemId !in ids }) return false
        return true
    }
}
