package io.savro.backup

import io.savro.common.Relogio
import io.savro.common.Resultado
import io.savro.domain.patrimonio.ErroRepositorio
import io.savro.domain.patrimonio.RepositorioItensPatrimoniais

/**
 * Orquestra os três fluxos da issue #121 sobre o cofre local: gerar backup, restaurar backup e
 * exportar CSV. Zero rede: nenhuma operação aqui, nem nas dependências que ela usa, fala com o
 * servidor Savro — o arquivo nunca sai do aparelho a não ser pelo seletor nativo, sob comando
 * explícito do usuário.
 *
 * [versaoEsquemaAtual] é injetada pelo host (`EsquemaSavro.VERSAO_ATUAL`) para este módulo não
 * precisar depender de `:shared:core:database` — que traria Room e SQLCipher junto.
 */
class ServicoBackup(
    private val repositorio: RepositorioItensPatrimoniais,
    private val preferencias: PreferenciasRestauraveis,
    private val arquivos: ArquivosDoSistema,
    private val areaTemporaria: AreaTemporariaBackup,
    private val relogio: Relogio,
    private val versaoEsquemaAtual: Int,
    private val iteracoesKdf: Int = FormatoBackup.ITERACOES_PADRAO,
) {

    /** Retrato consistente do cofre: itens, ajustes, linha do tempo e preferências do MVP1. */
    suspend fun montarConteudo(): Resultado<ConteudoBackup, ErroBackup> {
        val itens = when (val resultado = repositorio.listarTodos()) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro.paraErroBackup())
            is Resultado.Sucesso -> resultado.valor
        }
        val ajustes = when (val resultado = repositorio.listarTodosOsAjustes()) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro.paraErroBackup())
            is Resultado.Sucesso -> resultado.valor
        }
        val eventos = when (val resultado = repositorio.listarTimeline(itemId = null)) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro.paraErroBackup())
            is Resultado.Sucesso -> resultado.valor
        }
        return Resultado.Sucesso(
            ConteudoBackup(
                versaoEsquema = versaoEsquemaAtual,
                criadoEmEpocaMs = relogio.agoraEmEpocaMs(),
                itens = itens,
                ajustes = ajustes,
                eventos = eventos,
                preferencias = preferencias.ler(),
            ).ordenado(),
        )
    }

    /**
     * Gera o arquivo, grava em área temporária protegida e entrega ao seletor nativo. O
     * temporário é removido em qualquer desfecho — sucesso, cancelamento ou exceção.
     */
    suspend fun gerarBackup(senha: String): Resultado<Unit, ErroBackup> {
        if (senha.length < FormatoBackup.TAMANHO_MINIMO_SENHA) {
            return Resultado.Falha(ErroBackup.SenhaFraca)
        }
        val conteudo = when (val resultado = montarConteudo()) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro)
            is Resultado.Sucesso -> resultado.valor
        }
        val arquivo = when (val resultado = CodecArquivoBackup.gerar(conteudo, senha, iteracoesKdf)) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro)
            is Resultado.Sucesso -> resultado.valor
        }
        val nome = FormatoBackup.nomeDeArquivoSugerido(conteudo.criadoEmEpocaMs)
        return entregarAoSeletor(nome, FormatoBackup.TIPO_MIME, arquivo)
    }

    /** Mesma mecânica do backup, sem senha e sem cifra — o CSV é texto claro, por definição. */
    suspend fun exportarCsv(): Resultado<Unit, ErroBackup> {
        val itens = when (val resultado = repositorio.listarTodos()) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro.paraErroBackup())
            is Resultado.Sucesso -> resultado.valor
        }
        val agora = relogio.agoraEmEpocaMs()
        return entregarAoSeletor(
            nome = ExportadorCsv.nomeDeArquivoSugerido(agora),
            tipoMime = ExportadorCsv.TIPO_MIME,
            conteudo = ExportadorCsv.exportarComoBytes(itens),
        )
    }

    /** Passo 1 da restauração: usuário escolhe o arquivo. Nada é validado nem escrito ainda. */
    suspend fun selecionarArquivoDeBackup(): Resultado<ByteArray, ErroBackup> = try {
        arquivos.selecionar(FormatoBackup.TIPO_MIME, FormatoBackup.EXTENSAO_ARQUIVO)
            ?.let { Resultado.Sucesso(it) }
            ?: Resultado.Falha(ErroBackup.CanceladoPeloUsuario)
    } catch (excecao: Exception) {
        Resultado.Falha(ErroBackup.FalhaDeArquivo(excecao.message ?: "falha ao ler o arquivo"))
    }

    /**
     * Passo 2: valida cabeçalho, versão, integridade e senha, e devolve a prévia + o conteúdo já
     * autenticado. **Nenhuma escrita no banco acontece aqui** — arquivo inválido não altera nada.
     */
    suspend fun prepararRestauracao(
        arquivo: ByteArray,
        senha: String,
    ): Resultado<RestauracaoPreparada, ErroBackup> {
        val conteudo = when (val resultado = CodecArquivoBackup.abrir(arquivo, senha, versaoEsquemaAtual)) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro)
            is Resultado.Sucesso -> resultado.valor
        }
        val itensAtuais = when (val resultado = repositorio.listarTodos()) {
            is Resultado.Falha -> return Resultado.Falha(resultado.erro.paraErroBackup())
            is Resultado.Sucesso -> resultado.valor
        }
        return Resultado.Sucesso(
            RestauracaoPreparada(
                previa = CodecArquivoBackup.previa(conteudo, itensAtuais.size),
                conteudo = conteudo,
            ),
        )
    }

    /**
     * Passo 3, só depois da confirmação explícita do usuário: substituição total em **uma única
     * transação**. Qualquer falha no meio reverte tudo e o cofre continua exatamente como estava
     * (issue #121). MVP1 não faz mesclagem — a prévia avisa que os dados atuais serão
     * substituídos.
     *
     * As preferências só são gravadas depois do commit do banco: se a transação falhar, nem o
     * cofre nem as preferências mudam.
     */
    suspend fun aplicarRestauracao(conteudo: ConteudoBackup): Resultado<Unit, ErroBackup> {
        val ordenado = conteudo.ordenado()
        val resultado = repositorio.executarEmTransacao {
            apagarTudo()
            ordenado.itens.forEach { inserirItemRestaurado(it) }
            ordenado.ajustes.forEach { inserirAjusteRestaurado(it) }
            ordenado.eventos.forEach { inserirEventoRestaurado(it) }
        }
        return when (resultado) {
            is Resultado.Falha -> Resultado.Falha(resultado.erro.paraErroBackup())
            is Resultado.Sucesso -> {
                preferencias.gravar(ordenado.preferencias)
                Resultado.Sucesso(Unit)
            }
        }
    }

    private suspend fun entregarAoSeletor(
        nome: String,
        tipoMime: String,
        conteudo: ByteArray,
    ): Resultado<Unit, ErroBackup> {
        val caminho = try {
            areaTemporaria.gravar(nome, conteudo)
        } catch (excecao: Exception) {
            return Resultado.Falha(ErroBackup.FalhaDeArquivo(excecao.message ?: "falha ao gravar temporário"))
        } finally {
            conteudo.fill(0)
        }

        return try {
            if (arquivos.salvar(caminho, nome, tipoMime)) {
                Resultado.Sucesso(Unit)
            } else {
                Resultado.Falha(ErroBackup.CanceladoPeloUsuario)
            }
        } catch (excecao: Exception) {
            Resultado.Falha(ErroBackup.FalhaDeArquivo(excecao.message ?: "falha ao compartilhar"))
        } finally {
            // Sucesso, cancelamento e erro passam por aqui: o temporário nunca sobrevive ao fluxo.
            runCatching { areaTemporaria.remover(caminho) }
        }
    }
}

/** Resultado do passo de validação: o que mostrar e o que aplicar, se o usuário confirmar. */
data class RestauracaoPreparada(val previa: PreviaBackup, val conteudo: ConteudoBackup)

/**
 * Falha do cofre local nunca vira "arquivo inválido": o problema é do aparelho, não do backup.
 * O detalhe é um rótulo técnico curto e fixo — nunca a mensagem crua da engine, que poderia
 * carregar caminho de arquivo ou fragmento de SQL para a tela e para o log.
 */
private fun ErroRepositorio.paraErroBackup(): ErroBackup = ErroBackup.FalhaDeCofre(
    when (this) {
        is ErroRepositorio.FalhaAbertura -> "abertura"
        is ErroRepositorio.ChaveInvalida -> "chave"
        is ErroRepositorio.FalhaMigracao -> "migracao"
        is ErroRepositorio.ItemNaoEncontrado -> "item"
        is ErroRepositorio.FalhaTransacao -> "transacao"
        is ErroRepositorio.Desconhecido -> "desconhecido"
    },
)
