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
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroDivider
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.domain.patrimonio.ConversorMonetario
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.domain.patrimonio.calculo.ApresentacaoValor
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
            action = { SavroButton(label = "Voltar", onClick = aoVoltar, loadingStateDescription = "") },
        )
        return
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            SavroText(item.nome, style = SavroTextStyle.Headline)
            SavroButton(label = "Voltar", onClick = aoVoltar, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
        }

        SavroCard(modifier = Modifier.fillMaxWidth()) {
            SavroText(rotuloDoTipo(item.tipo), style = SavroTextStyle.Label)
            item.instituicao?.let { SavroText(it, style = SavroTextStyle.BodySmall) }
            if (item.arquivado) SavroText("Arquivado", style = SavroTextStyle.Label)

            SavroDivider(modifier = Modifier.padding(vertical = SavroThemeTokens.spacing.sm))

            LinhaComOculto("Valor atual", "${formatarValor(item)} ${item.moeda}", ocultarValores)

            valorInvestidoCentavos(item)?.let { valorInvestido ->
                LinhaComOculto(
                    "Valor investido",
                    "${ConversorMonetario.centavosParaTexto(valorInvestido)} ${item.moeda}",
                    ocultarValores,
                )
            }
            item.quantidadeMilesimos?.let {
                SavroText("Quantidade: ${ConversorMonetario.quantidadeMilesimosParaTexto(it)}", style = SavroTextStyle.BodySmall)
            }
            item.precoMedioCentavos?.let {
                LinhaComOculto("Preço médio", "${ConversorMonetario.centavosParaTexto(it)} ${item.moeda}", ocultarValores)
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

        Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
            SavroButton(label = "Editar", onClick = { aoEditar(item.id) }, style = SavroButtonStyle.Secondary, loadingStateDescription = "")
            SavroButton(
                label = "Ajustar valor",
                onClick = { aoAjustarValor(item.id) },
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
            SavroButton(
                label = "Duplicar",
                onClick = { escopo.launch { servico.duplicar(item.id); aoVoltar() } },
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
            SavroButton(
                label = if (item.arquivado) "Reativar" else "Arquivar",
                onClick = { escopo.launch { servico.arquivar(item.id, arquivado = !item.arquivado) } },
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
            SavroButton(
                label = "Excluir",
                onClick = { escopo.launch { servico.excluir(item.id); aoVoltar() } },
                style = SavroButtonStyle.Destructive,
                loadingStateDescription = "",
            )
        }

        SavroText("Linha do tempo", style = SavroTextStyle.Title)
        if (timeline.isEmpty()) {
            SavroText("Nenhum evento registrado ainda.", style = SavroTextStyle.BodySmall)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                items(timeline, key = { it.id }) { evento ->
                    SavroCard(modifier = Modifier.fillMaxWidth()) {
                        SavroText(rotuloDoEvento(evento.tipo), style = SavroTextStyle.Body)
                        SavroText(FormatadorData.paraDataCurta(evento.dataEpocaMs), style = SavroTextStyle.BodySmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun LinhaComOculto(rotulo: String, valorFormatado: String, oculto: Boolean) {
    val texto = ApresentacaoValor.texto(valorFormatado, oculto)
    val descricao = ApresentacaoValor.descricaoAcessibilidade("$rotulo: $valorFormatado", oculto)
    Row(
        modifier = Modifier.fillMaxWidth().semantics { contentDescription = descricao },
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        SavroText(rotulo, style = SavroTextStyle.Body)
        SavroText(texto, style = SavroTextStyle.Body)
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
