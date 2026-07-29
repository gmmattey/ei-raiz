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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroConfirmDialog
import io.savro.designsystem.componentes.SavroDivider
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.componentes.SavroIconButton
import io.savro.designsystem.componentes.SavroInlineIcon
import io.savro.designsystem.componentes.SavroMenuAction
import io.savro.designsystem.componentes.SavroOverflowMenu
import io.savro.designsystem.componentes.SavroPrivacyMask
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.domain.patrimonio.ConversorMonetario
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.domain.patrimonio.calculo.FormatadorData
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial
import io.savro.model.TipoEventoTimeline
import kotlinx.coroutines.launch

/**
 * Detalhe de um item patrimonial (issue #120): nome, classe, instituição, moeda, valor atual,
 * valor investido/quantidade/preço médio quando existirem, data e origem da atualização,
 * observações, ações (editar/ajustar valor/duplicar/arquivar/excluir) e a linha do tempo básica
 * do item.
 */
@Composable
internal fun TelaDetalheItem(
    servico: ServicoPatrimonio,
    itemId: String,
    ocultarValores: Boolean,
    aoVoltar: () -> Unit,
    aoEditar: (String) -> Unit,
    aoAjustarValor: (String) -> Unit,
) {
    val itens by servico.itens.collectAsState()
    val item = itens.firstOrNull { it.id == itemId }
    var timeline by remember(itemId) { mutableStateOf<List<EventoTimelineItem>>(emptyList()) }
    var confirmandoExclusao by remember(itemId) { mutableStateOf(false) }
    val escopo = rememberCoroutineScope()

    // Recarrega a timeline sempre que os itens mudam (CRUD/ajuste em qualquer tela) — a mesma
    // reatividade via StateFlow que Home e Patrimônio usam, aplicada à linha do tempo deste item.
    LaunchedEffect(itemId, itens) {
        val resultado = servico.listarTimelineDoItem(itemId)
        if (resultado is io.savro.common.Resultado.Sucesso) timeline = resultado.valor
    }

    if (item == null) {
        SavroStatePanel(
            state = SavroState.Empty,
            title = "Item não encontrado",
            message = "Este item pode ter sido excluído.",
            icon = SavroIcon.EstadoVazio,
            action = { SavroButton(label = "Voltar", onClick = aoVoltar, loadingStateDescription = "") },
        )
        return
    }

    if (confirmandoExclusao) {
        SavroConfirmDialog(
            title = "Excluir ${item.nome}?",
            message = "Esta ação não pode ser desfeita.",
            confirmLabel = "Excluir",
            cancelLabel = "Cancelar",
            onConfirm = {
                confirmandoExclusao = false
                escopo.launch { servico.excluir(item.id); aoVoltar() }
            },
            onDismiss = { confirmandoExclusao = false },
        )
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        // "Voltar" em texto vira ícone (chevron-esquerda) e as 5 ações viram menu "⋯", com
        // confirmação explícita antes de excluir (#220, item 19).
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                SavroIconButton(icon = SavroIcon.Voltar, contentDescription = "Voltar", onClick = aoVoltar)
                SavroText(item.nome, style = SavroTextStyle.Headline)
            }
            SavroOverflowMenu(
                contentDescription = "Mais opções para ${item.nome}",
                actions = listOf(
                    SavroMenuAction("Editar", { aoEditar(item.id) }),
                    SavroMenuAction("Ajustar valor", { aoAjustarValor(item.id) }),
                    SavroMenuAction("Duplicar", { escopo.launch { servico.duplicar(item.id); aoVoltar() } }),
                    SavroMenuAction(
                        if (item.arquivado) "Reativar" else "Arquivar",
                        { escopo.launch { servico.arquivar(item.id, arquivado = !item.arquivado) } },
                    ),
                    SavroMenuAction("Excluir", { confirmandoExclusao = true }, destructive = true),
                ),
            )
        }

        SavroCard(modifier = Modifier.fillMaxWidth()) {
            SavroText(rotuloDoTipo(item.tipo), style = SavroTextStyle.Label)
            item.instituicao?.let { SavroText(it, style = SavroTextStyle.BodySmall) }
            if (item.arquivado) SavroText("Arquivado", style = SavroTextStyle.Label)

            SavroDivider(modifier = Modifier.padding(vertical = SavroThemeTokens.spacing.sm))

            SavroPrivacyMask(rotulo = "Valor atual", valorFormatado = "${formatarValor(item)} ${item.moeda}", oculto = ocultarValores)

            valorInvestidoCentavos(item)?.let { valorInvestido ->
                SavroPrivacyMask(
                    rotulo = "Valor investido",
                    valorFormatado = "${ConversorMonetario.centavosParaTexto(valorInvestido)} ${item.moeda}",
                    oculto = ocultarValores,
                )
            }
            item.quantidadeMilesimos?.let {
                SavroText("Quantidade: ${ConversorMonetario.quantidadeMilesimosParaTexto(it)}", style = SavroTextStyle.BodySmall)
            }
            item.precoMedioCentavos?.let {
                SavroPrivacyMask(rotulo = "Preço médio", valorFormatado = "${ConversorMonetario.centavosParaTexto(it)} ${item.moeda}", oculto = ocultarValores)
            }

            SavroDivider(modifier = Modifier.padding(vertical = SavroThemeTokens.spacing.sm))

            SavroText(
                "Atualizado em ${FormatadorData.paraDataCurta(item.atualizadoEmEpocaMs)} · origem: ${rotuloDaOrigem(item.origem)}",
                style = SavroTextStyle.BodySmall,
            )
            item.observacao?.takeIf { it.isNotBlank() }?.let {
                SavroText(it, style = SavroTextStyle.BodySmall)
            }
        }

        SavroText("Linha do tempo", style = SavroTextStyle.Title)
        if (timeline.isEmpty()) {
            SavroText("Nenhum evento registrado ainda.", style = SavroTextStyle.BodySmall)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                items(timeline, key = { it.id }) { evento ->
                    SavroCard(modifier = Modifier.fillMaxWidth()) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                            // Ícone por tipo de evento (#220, item 20 — nice-to-have).
                            SavroInlineIcon(icon = iconeDoEvento(evento.tipo))
                            Column {
                                SavroText(rotuloDoEvento(evento.tipo), style = SavroTextStyle.Body)
                                SavroText(FormatadorData.paraDataCurta(evento.dataEpocaMs), style = SavroTextStyle.BodySmall)
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * `quantidadeMilesimos` (escalado x1000) * `precoMedioCentavos` / 1000 — sempre informativo, nunca
 * a fonte de verdade do valor do item (ver javadoc de [ItemPatrimonial]). `null` se algum dos dois
 * campos opcionais não existir.
 */
private fun valorInvestidoCentavos(item: ItemPatrimonial): Long? {
    val quantidade = item.quantidadeMilesimos ?: return null
    val precoMedio = item.precoMedioCentavos ?: return null
    return quantidade * precoMedio / 1000
}

private fun rotuloDaOrigem(origem: io.savro.model.OrigemValor): String = when (origem) {
    io.savro.model.OrigemValor.MANUAL -> "manual"
}

private fun rotuloDoEvento(tipo: TipoEventoTimeline): String = when (tipo) {
    TipoEventoTimeline.ITEM_CRIADO -> "Item criado"
    TipoEventoTimeline.VALOR_AJUSTADO -> "Valor ajustado"
    TipoEventoTimeline.ITEM_EDITADO -> "Item editado"
    TipoEventoTimeline.ITEM_ARQUIVADO -> "Item arquivado"
    TipoEventoTimeline.ITEM_REATIVADO -> "Item reativado"
}

private fun iconeDoEvento(tipo: TipoEventoTimeline): SavroIcon = when (tipo) {
    TipoEventoTimeline.ITEM_CRIADO -> SavroIcon.EventoCriado
    TipoEventoTimeline.VALOR_AJUSTADO -> SavroIcon.EventoValorAjustado
    TipoEventoTimeline.ITEM_EDITADO -> SavroIcon.EventoEditado
    TipoEventoTimeline.ITEM_ARQUIVADO -> SavroIcon.EventoArquivado
    TipoEventoTimeline.ITEM_REATIVADO -> SavroIcon.EventoReativado
}
