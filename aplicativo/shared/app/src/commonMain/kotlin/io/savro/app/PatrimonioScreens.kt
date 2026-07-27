package io.savro.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import io.savro.common.Resultado
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroDivider
import io.savro.designsystem.componentes.SavroFilterChip
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextField
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.domain.patrimonio.CampoFormularioItem
import io.savro.domain.patrimonio.ConversorMonetario
import io.savro.domain.patrimonio.ErroServicoPatrimonio
import io.savro.domain.patrimonio.ErroValidacaoItem
import io.savro.domain.patrimonio.EstadoFormularioItemPatrimonial
import io.savro.domain.patrimonio.FiltroItensPatrimoniais
import io.savro.domain.patrimonio.RascunhoFormularioItem
import io.savro.domain.patrimonio.ResumoItemPatrimonial
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.domain.patrimonio.ValidadorItemPatrimonial
import io.savro.model.ItemPatrimonial
import io.savro.model.TipoItemPatrimonial
import kotlinx.coroutines.launch

/**
 * Cadastro manual de patrimônio (issue #119). Navegação local (sem biblioteca externa — a #120 é
 * quem introduz navegação real entre Home/Patrimônio/Detalhe): lista com busca/filtro é o destino
 * padrão; formulário e ajuste de valor são sobrepostos por cima quando abertos.
 */
private sealed class DestinoPatrimonio {
    data object Lista : DestinoPatrimonio()
    data class Formulario(val itemIdEmEdicao: String?) : DestinoPatrimonio()
    data class Ajuste(val itemId: String) : DestinoPatrimonio()

    /**
     * Serialização mínima para [rememberSaveable] — sem isso, `destino` reseta para [Lista] em
     * qualquer recriação de processo (Android) ou perda de estado em memória (iOS), mesmo que o
     * rascunho do formulário em si (`RascunhoFormularioItem`) sobreviva: sem saber que o destino
     * era o formulário, a tela nunca chega a restaurá-lo (achado da revisão da fatia iOS, #119).
     */
    fun paraChave(): String = when (this) {
        Lista -> ""
        is Formulario -> "formulario:${itemIdEmEdicao.orEmpty()}"
        is Ajuste -> "ajuste:$itemId"
    }

    companion object {
        fun deChave(chave: String): DestinoPatrimonio = when {
            chave.isEmpty() -> Lista
            chave.startsWith("formulario:") -> Formulario(chave.removePrefix("formulario:").takeIf { it.isNotEmpty() })
            chave.startsWith("ajuste:") -> Ajuste(chave.removePrefix("ajuste:"))
            else -> Lista
        }
    }
}

@Composable
internal fun TelaPatrimonio(servico: ServicoPatrimonio, aoAbrirConfiguracaoProtecao: () -> Unit) {
    var destino by rememberSaveable(
        stateSaver = Saver(save = { it.paraChave() }, restore = { DestinoPatrimonio.deChave(it) }),
    ) { mutableStateOf<DestinoPatrimonio>(DestinoPatrimonio.Lista) }

    LaunchedEffect(servico) { servico.carregar() }

    when (val atual = destino) {
        DestinoPatrimonio.Lista -> TelaListaPatrimonio(
            servico = servico,
            aoAbrirConfiguracaoProtecao = aoAbrirConfiguracaoProtecao,
            aoCriar = { destino = DestinoPatrimonio.Formulario(itemIdEmEdicao = null) },
            aoEditar = { id -> destino = DestinoPatrimonio.Formulario(itemIdEmEdicao = id) },
            aoAjustarValor = { id -> destino = DestinoPatrimonio.Ajuste(id) },
        )
        is DestinoPatrimonio.Formulario -> TelaFormularioItem(
            servico = servico,
            itemIdEmEdicao = atual.itemIdEmEdicao,
            aoSalvar = { destino = DestinoPatrimonio.Lista },
            aoCancelar = { destino = DestinoPatrimonio.Lista },
        )
        is DestinoPatrimonio.Ajuste -> TelaAjusteDeValor(
            servico = servico,
            itemId = atual.itemId,
            aoConcluir = { destino = DestinoPatrimonio.Lista },
        )
    }
}

@Composable
private fun TelaListaPatrimonio(
    servico: ServicoPatrimonio,
    aoAbrirConfiguracaoProtecao: () -> Unit,
    aoCriar: () -> Unit,
    aoEditar: (String) -> Unit,
    aoAjustarValor: (String) -> Unit,
) {
    val itens by servico.itens.collectAsState()
    var texto by remember { mutableStateOf("") }
    var tipoSelecionado by remember { mutableStateOf<TipoItemPatrimonial?>(null) }
    var mostrarArquivados by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    val filtro = FiltroItensPatrimoniais(
        texto = texto,
        tipos = tipoSelecionado?.let { setOf(it) } ?: emptySet(),
        incluirArquivados = mostrarArquivados,
    )
    val itensFiltrados = filtro.aplicar(itens)

    Column(modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            SavroText("Patrimônio", style = SavroTextStyle.Headline)
            SavroButton(
                label = "Proteção",
                onClick = aoAbrirConfiguracaoProtecao,
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
        }

        SavroButton(
            label = "Novo item",
            onClick = aoCriar,
            modifier = Modifier.fillMaxWidth().padding(top = SavroThemeTokens.spacing.sm),
            loadingStateDescription = "",
        )

        SavroTextField(
            value = texto,
            onValueChange = { texto = it },
            label = "Buscar",
            modifier = Modifier.fillMaxWidth().padding(top = SavroThemeTokens.spacing.md),
        )

        Row(
            modifier = Modifier.fillMaxWidth().padding(top = SavroThemeTokens.spacing.sm),
            horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
        ) {
            SavroFilterChip(
                label = "Arquivados",
                selected = mostrarArquivados,
                onClick = { mostrarArquivados = !mostrarArquivados },
            )
            TipoItemPatrimonial.entries.forEach { tipo ->
                SavroFilterChip(
                    label = rotuloDoTipo(tipo),
                    selected = tipoSelecionado == tipo,
                    onClick = { tipoSelecionado = if (tipoSelecionado == tipo) null else tipo },
                )
            }
        }

        if (itensFiltrados.isEmpty()) {
            SavroStatePanel(
                state = SavroState.Empty,
                title = "Nenhum item encontrado",
                message = "Cadastre um item ou ajuste a busca/filtro.",
                modifier = Modifier.padding(top = SavroThemeTokens.spacing.md),
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(top = SavroThemeTokens.spacing.md),
                verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
            ) {
                items(itensFiltrados, key = { it.id }) { item ->
                    ItemPatrimonialCard(
                        item = item,
                        aoEditar = { aoEditar(item.id) },
                        aoAjustarValor = { aoAjustarValor(item.id) },
                        aoDuplicar = { escopo.launch { servico.duplicar(item.id) } },
                        aoArquivar = { escopo.launch { servico.arquivar(item.id, arquivado = !item.arquivado) } },
                        aoExcluir = { escopo.launch { servico.excluir(item.id) } },
                    )
                }
            }
        }
    }
}

@Composable
private fun ItemPatrimonialCard(
    item: ItemPatrimonial,
    aoEditar: () -> Unit,
    aoAjustarValor: () -> Unit,
    aoDuplicar: () -> Unit,
    aoArquivar: () -> Unit,
    aoExcluir: () -> Unit,
) {
    SavroCard(modifier = Modifier.fillMaxWidth()) {
        SavroText(item.nome, style = SavroTextStyle.Title)
        SavroText("${rotuloDoTipo(item.tipo)} · ${formatarValor(item)} ${item.moeda}", style = SavroTextStyle.Body)
        item.instituicao?.let { SavroText(it, style = SavroTextStyle.BodySmall) }
        if (item.arquivado) SavroText("Arquivado", style = SavroTextStyle.Label)

        SavroDivider(modifier = Modifier.padding(vertical = SavroThemeTokens.spacing.sm))

        Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
            SavroButton(label = "Editar", onClick = aoEditar, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
            SavroButton(label = "Ajustar valor", onClick = aoAjustarValor, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
            SavroButton(label = "Duplicar", onClick = aoDuplicar, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
        }
        Row(
            modifier = Modifier.padding(top = SavroThemeTokens.spacing.sm),
            horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
        ) {
            SavroButton(
                label = if (item.arquivado) "Desarquivar" else "Arquivar",
                onClick = aoArquivar,
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
            SavroButton(label = "Excluir", onClick = aoExcluir, style = SavroButtonStyle.Destructive, loadingStateDescription = "")
        }
    }
}

/**
 * Formulário de criação/edição (issue #119). [rememberSaveable] com [RascunhoFormularioItem]
 * como serializador guarda o rascunho através de recriação de Activity no Android (via
 * `SavedStateRegistry` nativo) e, no iOS, através de qualquer recomposição enquanto o app segue
 * vivo (background→foreground, cofre relockar/desbloquear) — o `ComposeUIViewController` do host
 * iOS não precisou de adapter nativo adicional; decisão e motivo documentados em
 * `SavroViewController.kt`/`SavroAppViewController()` (investigação de Igor, #119). `destino`, em
 * [TelaPatrimonio], também usa `rememberSaveable` — sem isso, a navegação até o formulário se
 * perderia antes mesmo do rascunho importar. Em ambas as plataformas, só a morte total do processo
 * pelo sistema operacional (não coberta por nenhum `Saver` em memória) ainda perde o rascunho —
 * risco de arquitetura registrado, não exclusivo de nenhuma plataforma.
 */
@Composable
private fun TelaFormularioItem(
    servico: ServicoPatrimonio,
    itemIdEmEdicao: String?,
    aoSalvar: () -> Unit,
    aoCancelar: () -> Unit,
) {
    val itens by servico.itens.collectAsState()
    val itemOriginal = remember(itemIdEmEdicao, itens) { itens.firstOrNull { it.id == itemIdEmEdicao } }

    var estado by rememberSaveable(
        stateSaver = Saver(
            save = { RascunhoFormularioItem.serializar(it) },
            restore = { RascunhoFormularioItem.restaurar(it) },
        ),
    ) {
        mutableStateOf(itemOriginal?.paraEstadoDeFormulario() ?: EstadoFormularioItemPatrimonial())
    }

    var mostrarResumo by rememberSaveable { mutableStateOf(false) }
    var erros by remember { mutableStateOf<List<ErroValidacaoItem>>(emptyList()) }
    var salvando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        SavroText(if (itemIdEmEdicao == null) "Novo item" else "Editar item", style = SavroTextStyle.Headline)

        if (mostrarResumo) {
            val validado = ValidadorItemPatrimonial.validar(estado)
            if (validado is Resultado.Sucesso) {
                val resumo = ResumoItemPatrimonial.de(validado.valor)
                PainelResumo(resumo)
                Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                    SavroButton(
                        label = "Voltar e editar",
                        onClick = { mostrarResumo = false },
                        style = SavroButtonStyle.Secondary,
                        loadingStateDescription = "",
                    )
                    SavroButton(
                        label = "Salvar",
                        loading = salvando,
                        loadingStateDescription = "Salvando",
                        onClick = {
                            salvando = true
                            escopo.launch {
                                val resultado = if (itemIdEmEdicao == null) {
                                    servico.criar(estado.copy(itemIdEmEdicao = null))
                                } else {
                                    servico.editar(estado.copy(itemIdEmEdicao = itemIdEmEdicao))
                                }
                                salvando = false
                                when (resultado) {
                                    is Resultado.Sucesso -> aoSalvar()
                                    is Resultado.Falha -> {
                                        val erroServico = resultado.erro
                                        erros = if (erroServico is ErroServicoPatrimonio.ValidacaoFalhou) {
                                            erroServico.erros
                                        } else {
                                            emptyList()
                                        }
                                        mostrarResumo = false
                                    }
                                }
                            }
                        },
                    )
                }
            }
        } else {
            FormularioCampos(estado = estado, aoAlterar = { estado = it }, erros = erros)
            Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                SavroButton(label = "Cancelar", onClick = aoCancelar, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
                SavroButton(
                    label = "Revisar",
                    onClick = {
                        val resultado = ValidadorItemPatrimonial.validar(estado)
                        when (resultado) {
                            is Resultado.Sucesso -> {
                                erros = emptyList()
                                mostrarResumo = true
                            }
                            is Resultado.Falha -> erros = resultado.erro
                        }
                    },
                    loadingStateDescription = "",
                )
            }
        }
    }
}

@Composable
private fun FormularioCampos(
    estado: EstadoFormularioItemPatrimonial,
    aoAlterar: (EstadoFormularioItemPatrimonial) -> Unit,
    erros: List<ErroValidacaoItem>,
) {
    val camposVisiveis = estado.camposVisiveis()

    Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        TipoItemPatrimonial.entries.forEach { tipo ->
            SavroFilterChip(
                label = rotuloDoTipo(tipo),
                selected = estado.tipo == tipo,
                onClick = { aoAlterar(estado.copy(tipo = tipo)) },
            )
        }
    }

    if (CampoFormularioItem.NOME in camposVisiveis) {
        SavroTextField(
            value = estado.nome,
            onValueChange = { aoAlterar(estado.copy(nome = it)) },
            label = "Nome",
            isError = erros.any { it is ErroValidacaoItem.NomeObrigatorio || it is ErroValidacaoItem.NomeMuitoLongo },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (CampoFormularioItem.VALOR in camposVisiveis) {
        SavroTextField(
            value = estado.valorTexto,
            onValueChange = { aoAlterar(estado.copy(valorTexto = it)) },
            label = if (estado.tipo == TipoItemPatrimonial.DIVIDA) "Valor da dívida (negativo)" else "Valor atual",
            isError = erros.any {
                it is ErroValidacaoItem.ValorObrigatorio || it is ErroValidacaoItem.ValorNaoPodeSerNegativo ||
                    it is ErroValidacaoItem.ValorDeDividaDeveSerNegativoOuZero
            },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (CampoFormularioItem.MOEDA in camposVisiveis) {
        SavroTextField(
            value = estado.moeda,
            onValueChange = { aoAlterar(estado.copy(moeda = it)) },
            label = "Moeda (ex.: BRL)",
            isError = erros.any { it is ErroValidacaoItem.MoedaObrigatoria || it is ErroValidacaoItem.MoedaInvalida },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (CampoFormularioItem.QUANTIDADE in camposVisiveis) {
        SavroTextField(
            value = estado.quantidadeTexto,
            onValueChange = { aoAlterar(estado.copy(quantidadeTexto = it)) },
            label = "Quantidade (opcional)",
            isError = erros.any { it is ErroValidacaoItem.QuantidadeDeveSerPositiva },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (CampoFormularioItem.PRECO_MEDIO in camposVisiveis) {
        SavroTextField(
            value = estado.precoMedioTexto,
            onValueChange = { aoAlterar(estado.copy(precoMedioTexto = it)) },
            label = "Preço médio (opcional)",
            isError = erros.any { it is ErroValidacaoItem.PrecoMedioDeveSerPositivo },
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (CampoFormularioItem.INSTITUICAO in camposVisiveis) {
        SavroTextField(
            value = estado.instituicao,
            onValueChange = { aoAlterar(estado.copy(instituicao = it)) },
            label = "Instituição (opcional)",
            modifier = Modifier.fillMaxWidth(),
        )
    }
    if (CampoFormularioItem.OBSERVACAO in camposVisiveis) {
        SavroTextField(
            value = estado.observacao,
            onValueChange = { aoAlterar(estado.copy(observacao = it)) },
            label = "Observação (opcional)",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun PainelResumo(resumo: ResumoItemPatrimonial) {
    SavroCard(modifier = Modifier.fillMaxWidth()) {
        SavroText("Confira antes de salvar", style = SavroTextStyle.Title)
        SavroText("${rotuloDoTipo(resumo.tipo)} · ${resumo.nome}", style = SavroTextStyle.Body)
        SavroText("${resumo.valorFormatado} ${resumo.moeda}", style = SavroTextStyle.Body)
        resumo.instituicao?.let { SavroText(it, style = SavroTextStyle.BodySmall) }
        resumo.observacao?.let { SavroText(it, style = SavroTextStyle.BodySmall) }
        resumo.quantidadeFormatada?.let { SavroText("Quantidade: $it", style = SavroTextStyle.BodySmall) }
        resumo.precoMedioFormatado?.let { SavroText("Preço médio: $it", style = SavroTextStyle.BodySmall) }
    }
}

@Composable
private fun TelaAjusteDeValor(servico: ServicoPatrimonio, itemId: String, aoConcluir: () -> Unit) {
    val itens by servico.itens.collectAsState()
    val item = itens.firstOrNull { it.id == itemId }
    var novoValorTexto by rememberSaveable(itemId) { mutableStateOf("") }
    var erro by remember { mutableStateOf<String?>(null) }
    var salvando by remember { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        SavroText("Ajustar valor", style = SavroTextStyle.Headline)
        if (item != null) {
            SavroText("${item.nome} · valor atual: ${formatarValor(item)} ${item.moeda}", style = SavroTextStyle.Body)
        }
        SavroTextField(
            value = novoValorTexto,
            onValueChange = { novoValorTexto = it },
            label = "Novo valor",
            isError = erro != null,
            supportingText = erro,
            modifier = Modifier.fillMaxWidth(),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
            SavroButton(label = "Cancelar", onClick = aoConcluir, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
            SavroButton(
                label = "Confirmar ajuste",
                loading = salvando,
                loadingStateDescription = "Salvando",
                onClick = {
                    salvando = true
                    escopo.launch {
                        when (val resultado = servico.ajustarValor(itemId, novoValorTexto)) {
                            is Resultado.Sucesso -> aoConcluir()
                            is Resultado.Falha -> erro = "Não foi possível salvar o ajuste"
                        }
                        salvando = false
                    }
                },
            )
        }
    }
}

private fun ItemPatrimonial.paraEstadoDeFormulario(): EstadoFormularioItemPatrimonial =
    EstadoFormularioItemPatrimonial(
        itemIdEmEdicao = id,
        tipo = tipo,
        nome = nome,
        valorTexto = ConversorMonetario.centavosParaTexto(valorCentavos),
        moeda = moeda,
        instituicao = instituicao.orEmpty(),
        observacao = observacao.orEmpty(),
        quantidadeTexto = quantidadeMilesimos?.let { ConversorMonetario.quantidadeMilesimosParaTexto(it) }.orEmpty(),
        precoMedioTexto = precoMedioCentavos?.let { ConversorMonetario.centavosParaTexto(it) }.orEmpty(),
    )

private fun formatarValor(item: ItemPatrimonial): String =
    ConversorMonetario.centavosParaTexto(item.valorCentavos)

private fun rotuloDoTipo(tipo: TipoItemPatrimonial): String = when (tipo) {
    TipoItemPatrimonial.CONTA -> "Conta"
    TipoItemPatrimonial.RENDA_VARIAVEL -> "Renda variável"
    TipoItemPatrimonial.RENDA_FIXA -> "Renda fixa"
    TipoItemPatrimonial.CRIPTO -> "Cripto"
    TipoItemPatrimonial.BEM -> "Bem"
    TipoItemPatrimonial.DIVIDA -> "Dívida"
    TipoItemPatrimonial.OUTRO -> "Outro"
}
