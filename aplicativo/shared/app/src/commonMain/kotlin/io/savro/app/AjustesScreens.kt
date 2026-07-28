package io.savro.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import io.savro.app.recursos.Res
import io.savro.app.recursos.configuracao_protecao_botao_ativar
import io.savro.app.recursos.configuracao_protecao_botao_remover
import io.savro.app.recursos.configuracao_protecao_estado_ativada
import io.savro.app.recursos.configuracao_protecao_estado_desativada
import io.savro.app.recursos.configuracao_protecao_permitir_credencial
import io.savro.app.recursos.configuracao_protecao_titulo
import io.savro.backup.ConteudoBackup
import io.savro.backup.ErroBackup
import io.savro.backup.FormatoBackup
import io.savro.backup.PreviaBackup
import io.savro.backup.ServicoBackup
import io.savro.common.Resultado
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroDivider
import io.savro.designsystem.componentes.SavroFilterChip
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.componentes.SavroTextField
import io.savro.designsystem.componentes.SavroWarningBanner
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.domain.patrimonio.calculo.FormatadorData
import io.savro.security.GerenciadorCofre
import io.savro.security.PoliticaProtecao
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/**
 * Tela de Ajustes (#121) — reúne a proteção do cofre (#118, que já existia aqui) e os três fluxos
 * novos: criar backup criptografado, restaurar backup e exportar CSV.
 *
 * Nenhum valor patrimonial aparece nesta tela: a prévia da restauração mostra contagens, moedas e
 * datas, nunca saldos — a máscara de valores e as garantias de privacidade das telas de patrimônio
 * continuam valendo, e aqui não há o que mascarar.
 */
@Composable
internal fun TelaAjustes(
    gerenciador: GerenciadorCofre,
    servicoBackup: ServicoBackup,
    aoFechar: () -> Unit,
) {
    var passo by remember { mutableStateOf<PassoAjustes>(PassoAjustes.Menu) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.lg),
    ) {
        SavroText("Ajustes", style = SavroTextStyle.Headline)

        when (val atual = passo) {
            PassoAjustes.Menu -> {
                SecaoProtecao(gerenciador)
                SavroDivider()
                SecaoDadosDoUsuario(
                    aoCriarBackup = { passo = PassoAjustes.SenhaDoBackup },
                    aoRestaurar = { passo = PassoAjustes.SelecionarArquivo },
                    aoExportarCsv = { passo = PassoAjustes.ConfirmarCsv },
                )
                SavroButton(
                    label = "Fechar",
                    onClick = aoFechar,
                    style = SavroButtonStyle.Secondary,
                    loadingStateDescription = "",
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            PassoAjustes.SenhaDoBackup -> PassoSenhaDoBackup(
                servicoBackup = servicoBackup,
                aoVoltar = { passo = PassoAjustes.Menu },
                aoConcluir = { passo = it },
            )

            PassoAjustes.SelecionarArquivo -> PassoSelecionarArquivo(
                servicoBackup = servicoBackup,
                aoVoltar = { passo = PassoAjustes.Menu },
                aoConcluir = { passo = it },
            )

            is PassoAjustes.SenhaDaRestauracao -> PassoSenhaDaRestauracao(
                servicoBackup = servicoBackup,
                arquivo = atual.arquivo,
                aoVoltar = { passo = PassoAjustes.Menu },
                aoConcluir = { passo = it },
            )

            is PassoAjustes.Previa -> PassoPreviaDaRestauracao(
                servicoBackup = servicoBackup,
                previa = atual.previa,
                conteudo = atual.conteudo,
                aoVoltar = { passo = PassoAjustes.Menu },
                aoConcluir = { passo = it },
            )

            PassoAjustes.ConfirmarCsv -> PassoExportarCsv(
                servicoBackup = servicoBackup,
                aoVoltar = { passo = PassoAjustes.Menu },
                aoConcluir = { passo = it },
            )

            is PassoAjustes.Resultado -> SavroStatePanel(
                state = if (atual.erro) SavroState.Error else SavroState.Empty,
                title = atual.titulo,
                message = atual.mensagem,
                icon = if (atual.erro) SavroIcon.EstadoErro else SavroIcon.EstadoVazio,
                action = {
                    SavroButton(
                        label = "Voltar aos ajustes",
                        onClick = { passo = PassoAjustes.Menu },
                        loadingStateDescription = "",
                        modifier = Modifier.fillMaxWidth(),
                    )
                },
            )
        }
    }
}

private sealed interface PassoAjustes {
    data object Menu : PassoAjustes
    data object SenhaDoBackup : PassoAjustes
    data object SelecionarArquivo : PassoAjustes
    data class SenhaDaRestauracao(val arquivo: ByteArray) : PassoAjustes
    data class Previa(val previa: PreviaBackup, val conteudo: ConteudoBackup) : PassoAjustes
    data object ConfirmarCsv : PassoAjustes
    data class Resultado(val titulo: String, val mensagem: String, val erro: Boolean) : PassoAjustes
}

@Composable
private fun SecaoDadosDoUsuario(
    aoCriarBackup: () -> Unit,
    aoRestaurar: () -> Unit,
    aoExportarCsv: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroText("Seus dados", style = SavroTextStyle.Title)
        SavroText(
            "Backup, restauração e exportação são gratuitos e acontecem só no seu aparelho. " +
                "Nenhum arquivo é enviado para o Savro.",
            style = SavroTextStyle.BodySmall,
        )
        SavroButton(
            label = "Criar backup criptografado",
            onClick = aoCriarBackup,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = "Restaurar backup",
            onClick = aoRestaurar,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = "Exportar CSV",
            onClick = aoExportarCsv,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun PassoSenhaDoBackup(
    servicoBackup: ServicoBackup,
    aoVoltar: () -> Unit,
    aoConcluir: (PassoAjustes) -> Unit,
) {
    val escopo = rememberCoroutineScope()
    var senha by remember { mutableStateOf("") }
    var confirmacao by remember { mutableStateOf("") }
    var erro by remember { mutableStateOf<String?>(null) }
    var executando by remember { mutableStateOf(false) }

    val senhaCurta = senha.isNotEmpty() && senha.length < FormatoBackup.TAMANHO_MINIMO_SENHA
    val naoConfere = confirmacao.isNotEmpty() && confirmacao != senha
    val podeGerar = senha.length >= FormatoBackup.TAMANHO_MINIMO_SENHA && senha == confirmacao

    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroText("Criar backup", style = SavroTextStyle.Title)
        SavroWarningBanner(
            "Sem esta senha o backup não abre. O Savro não guarda cópia dela e não tem como " +
                "recuperá-la.",
        )
        SavroTextField(
            value = senha,
            onValueChange = { senha = it },
            label = "Senha do backup",
            supportingText = "Mínimo de ${FormatoBackup.TAMANHO_MINIMO_SENHA} caracteres",
            isError = senhaCurta,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        SavroTextField(
            value = confirmacao,
            onValueChange = { confirmacao = it },
            label = "Repetir a senha",
            supportingText = if (naoConfere) "As senhas não conferem" else null,
            isError = naoConfere,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        erro?.let { SavroStatePanel(state = SavroState.Error, title = "Não foi possível gerar", message = it) }
        SavroButton(
            label = "Gerar e salvar",
            onClick = {
                executando = true
                erro = null
                escopo.launch {
                    when (val resultado = servicoBackup.gerarBackup(senha)) {
                        is Resultado.Sucesso -> aoConcluir(
                            PassoAjustes.Resultado(
                                titulo = "Backup salvo",
                                mensagem = "Guarde o arquivo e a senha em lugares diferentes.",
                                erro = false,
                            ),
                        )
                        is Resultado.Falha -> {
                            executando = false
                            if (resultado.erro is ErroBackup.CanceladoPeloUsuario) aoVoltar()
                            else erro = mensagemDeErro(resultado.erro)
                        }
                    }
                }
            },
            enabled = podeGerar,
            loading = executando,
            loadingStateDescription = "Gerando backup",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = "Cancelar",
            onClick = aoVoltar,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun PassoSelecionarArquivo(
    servicoBackup: ServicoBackup,
    aoVoltar: () -> Unit,
    aoConcluir: (PassoAjustes) -> Unit,
) {
    // O seletor nativo abre sozinho ao entrar no passo: uma tela intermediária só com o botão
    // "escolher arquivo" seria um clique a mais sem informação nova.
    LaunchedEffect(Unit) {
        when (val resultado = servicoBackup.selecionarArquivoDeBackup()) {
            is Resultado.Sucesso -> aoConcluir(PassoAjustes.SenhaDaRestauracao(resultado.valor))
            is Resultado.Falha ->
                if (resultado.erro is ErroBackup.CanceladoPeloUsuario) aoVoltar()
                else aoConcluir(
                    PassoAjustes.Resultado("Não foi possível ler", mensagemDeErro(resultado.erro), erro = true),
                )
        }
    }

    SavroStatePanel(
        state = SavroState.Loading,
        title = "Escolha o arquivo de backup",
        message = "Selecione um arquivo .${FormatoBackup.EXTENSAO_ARQUIVO} no seletor do sistema.",
    )
}

@Composable
private fun PassoSenhaDaRestauracao(
    servicoBackup: ServicoBackup,
    arquivo: ByteArray,
    aoVoltar: () -> Unit,
    aoConcluir: (PassoAjustes) -> Unit,
) {
    val escopo = rememberCoroutineScope()
    var senha by remember { mutableStateOf("") }
    var erro by remember { mutableStateOf<String?>(null) }
    var executando by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroText("Restaurar backup", style = SavroTextStyle.Title)
        SavroText("Informe a senha usada quando o backup foi criado.", style = SavroTextStyle.BodySmall)
        SavroTextField(
            value = senha,
            onValueChange = { senha = it },
            label = "Senha do backup",
            visualTransformation = PasswordVisualTransformation(),
            isError = erro != null,
            modifier = Modifier.fillMaxWidth(),
        )
        erro?.let { SavroStatePanel(state = SavroState.Error, title = "Não foi possível abrir", message = it) }
        SavroButton(
            label = "Continuar",
            onClick = {
                executando = true
                erro = null
                escopo.launch {
                    when (val resultado = servicoBackup.prepararRestauracao(arquivo, senha)) {
                        is Resultado.Sucesso -> aoConcluir(
                            PassoAjustes.Previa(resultado.valor.previa, resultado.valor.conteudo),
                        )
                        is Resultado.Falha -> {
                            executando = false
                            erro = mensagemDeErro(resultado.erro)
                        }
                    }
                }
            },
            enabled = senha.isNotEmpty(),
            loading = executando,
            loadingStateDescription = "Validando arquivo",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = "Cancelar",
            onClick = aoVoltar,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun PassoPreviaDaRestauracao(
    servicoBackup: ServicoBackup,
    previa: PreviaBackup,
    conteudo: ConteudoBackup,
    aoVoltar: () -> Unit,
    aoConcluir: (PassoAjustes) -> Unit,
) {
    val escopo = rememberCoroutineScope()
    var executando by remember { mutableStateOf(false) }
    var confirmou by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroText("Conferir antes de restaurar", style = SavroTextStyle.Title)
        SavroCard(modifier = Modifier.fillMaxWidth()) {
            SavroText("Data do backup: ${FormatadorData.paraDataCurta(previa.criadoEmEpocaMs)}")
            SavroText("Itens no arquivo: ${previa.totalDeItens}")
            SavroText("Ajustes de valor: ${previa.totalDeAjustes}")
            SavroText("Eventos da linha do tempo: ${previa.totalDeEventos}")
            SavroText("Moedas: ${previa.moedas.joinToString(", ").ifEmpty { "—" }}")
            SavroText("Versão do formato: ${previa.versaoFormato} · schema ${previa.versaoEsquema}")
        }
        SavroWarningBanner(
            "Isso substituirá todos os dados atuais deste aparelho " +
                "(${previa.itensNoCofreAtual} ${if (previa.itensNoCofreAtual == 1) "item" else "itens"}). " +
                "Não há mesclagem e a ação não pode ser desfeita.",
        )
        // Confirmação explícita (#121): o botão de restaurar só habilita depois de o usuário
        // marcar que entendeu a substituição — clicar direto no botão principal não basta.
        SavroFilterChip(
            label = "Entendi que os dados atuais serão substituídos",
            selected = confirmou,
            onClick = { confirmou = !confirmou },
        )
        SavroButton(
            label = "Restaurar agora",
            onClick = {
                executando = true
                escopo.launch {
                    val resultado = servicoBackup.aplicarRestauracao(conteudo)
                    executando = false
                    aoConcluir(
                        when (resultado) {
                            is Resultado.Sucesso -> PassoAjustes.Resultado(
                                titulo = "Backup restaurado",
                                mensagem = "${previa.totalDeItens} itens voltaram para este aparelho.",
                                erro = false,
                            )
                            is Resultado.Falha -> PassoAjustes.Resultado(
                                titulo = "Restauração não concluída",
                                mensagem = mensagemDeErro(resultado.erro),
                                erro = true,
                            )
                        },
                    )
                }
            },
            enabled = confirmou,
            loading = executando,
            style = SavroButtonStyle.Destructive,
            loadingStateDescription = "Restaurando",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = "Cancelar",
            onClick = aoVoltar,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun PassoExportarCsv(
    servicoBackup: ServicoBackup,
    aoVoltar: () -> Unit,
    aoConcluir: (PassoAjustes) -> Unit,
) {
    val escopo = rememberCoroutineScope()
    var executando by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroText("Exportar CSV", style = SavroTextStyle.Title)
        SavroWarningBanner(
            "O CSV é um arquivo de texto sem senha e sem criptografia: qualquer pessoa com " +
                "acesso a ele vê seus dados. Para guardar com proteção, use o backup criptografado.",
        )
        SavroButton(
            label = "Exportar mesmo assim",
            onClick = {
                executando = true
                escopo.launch {
                    val resultado = servicoBackup.exportarCsv()
                    executando = false
                    when (resultado) {
                        is Resultado.Sucesso -> aoConcluir(
                            PassoAjustes.Resultado("CSV exportado", "O arquivo foi salvo onde você escolheu.", erro = false),
                        )
                        is Resultado.Falha ->
                            if (resultado.erro is ErroBackup.CanceladoPeloUsuario) aoVoltar()
                            else aoConcluir(
                                PassoAjustes.Resultado("Exportação não concluída", mensagemDeErro(resultado.erro), erro = true),
                            )
                    }
                }
            },
            loading = executando,
            loadingStateDescription = "Exportando",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = "Cancelar",
            onClick = aoVoltar,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/** Proteção do cofre (#118) — mesmo conteúdo que antes vivia em `CofreScreens.kt`. */
@Composable
private fun SecaoProtecao(gerenciador: GerenciadorCofre) {
    val escopo = rememberCoroutineScope()
    var politica by remember { mutableStateOf<PoliticaProtecao?>(null) }

    LaunchedEffect(gerenciador) { politica = gerenciador.politicaAtual() }

    Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        SavroText(stringResource(Res.string.configuracao_protecao_titulo), style = SavroTextStyle.Title)

        when (val atual = politica) {
            null -> Unit
            PoliticaProtecao.Nenhuma -> {
                SavroText(stringResource(Res.string.configuracao_protecao_estado_desativada))
                SavroButton(
                    label = stringResource(Res.string.configuracao_protecao_botao_ativar),
                    onClick = {
                        escopo.launch {
                            gerenciador.ativarProtecao()
                            politica = gerenciador.politicaAtual()
                        }
                    },
                    loadingStateDescription = "",
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            is PoliticaProtecao.Ativada -> {
                SavroText(stringResource(Res.string.configuracao_protecao_estado_ativada))
                SavroFilterChip(
                    label = stringResource(Res.string.configuracao_protecao_permitir_credencial),
                    selected = atual.permitirCredencialDispositivo,
                    onClick = {
                        escopo.launch {
                            gerenciador.alterarProtecao(!atual.permitirCredencialDispositivo)
                            politica = gerenciador.politicaAtual()
                        }
                    },
                )
                SavroButton(
                    label = stringResource(Res.string.configuracao_protecao_botao_remover),
                    onClick = {
                        escopo.launch {
                            gerenciador.removerProtecao()
                            politica = gerenciador.politicaAtual()
                        }
                    },
                    style = SavroButtonStyle.Destructive,
                    loadingStateDescription = "",
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

/**
 * Texto de erro apresentado ao usuário. `ArquivoInvalido` é deliberadamente genérico: nunca diz se
 * o problema foi senha errada, adulteração ou corrupção (ver `ErroBackup`).
 */
private fun mensagemDeErro(erro: ErroBackup): String = when (erro) {
    ErroBackup.ArquivoInvalido ->
        "Arquivo inválido ou senha incorreta. Confira o arquivo e a senha e tente de novo."
    is ErroBackup.VersaoFormatoIncompativel ->
        "Este backup foi criado por uma versão mais nova do Savro. Atualize o app para restaurá-lo."
    is ErroBackup.EsquemaIncompativel ->
        "Este backup tem dados de uma versão mais nova do Savro. Atualize o app para restaurá-lo."
    ErroBackup.SenhaFraca ->
        "Use uma senha com pelo menos ${FormatoBackup.TAMANHO_MINIMO_SENHA} caracteres."
    is ErroBackup.FalhaDeCofre ->
        "Não foi possível acessar o cofre deste aparelho. Seus dados atuais continuam intactos."
    is ErroBackup.FalhaDeArquivo ->
        "Não foi possível ler ou gravar o arquivo escolhido."
    ErroBackup.CanceladoPeloUsuario -> "Operação cancelada."
}
