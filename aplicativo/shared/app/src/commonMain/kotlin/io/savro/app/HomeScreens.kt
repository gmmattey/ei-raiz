package io.savro.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroDivider
import io.savro.designsystem.componentes.SavroDonutChart
import io.savro.designsystem.componentes.SavroDonutSlice
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.componentes.SavroIconButton
import io.savro.designsystem.componentes.SavroInlineIcon
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.domain.patrimonio.ConversorMonetario
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.domain.patrimonio.calculo.ApresentacaoValor
import io.savro.domain.patrimonio.calculo.CalculoPatrimonio
import io.savro.domain.patrimonio.calculo.FormatadorData
import io.savro.model.TipoItemPatrimonial

/**
 * Home (issue #120): patrimônio bruto, dívidas, patrimônio líquido, distribuição básica por
 * classe, data da última atualização, itens que precisam de atualização e a ação principal de
 * adicionar item. Usa exatamente [CalculoPatrimonio] — o mesmo motor de cálculo consumido por
 * Patrimônio e Detalhe (nenhuma soma/porcentagem é recalculada de outra forma aqui).
 *
 * Auditoria #220 (protótipo tela 07): hierarquia invertida — líquido vira o número hero, ocultar
 * valores vira ícone no header, distribuição ganha donut chart, itens desatualizados viram linha
 * compacta. Nenhum valor de [CalculoPatrimonio.resumo]/[CalculoPatrimonio.distribuicaoPorClasse]
 * muda — só a apresentação.
 */
@Composable
internal fun TelaHomeResumo(
    servico: ServicoPatrimonio,
    ocultarValores: Boolean,
    aoAlternarOcultarValores: () -> Unit,
    aoCriar: () -> Unit,
    aoAbrirItem: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    val itens by servico.itens.collectAsState()
    val resumo = remember(itens) { CalculoPatrimonio.resumo(itens) }
    val distribuicoes = remember(itens) { CalculoPatrimonio.distribuicaoPorClasse(itens) }
    val dataUltimaAtualizacao = remember(itens) { CalculoPatrimonio.dataUltimaAtualizacao(itens) }
    val itensDesatualizados = remember(itens) {
        CalculoPatrimonio.itensQuePrecisamAtualizacao(itens, agoraEpocaMs = servico.agoraEmEpocaMs())
    }

    // `contentPadding` vem de `SavroBottomNavScaffold` (altura real da bottom nav, sem valor fixo
    // arbitrário) — correção pós-revisão do Luiz (PR #224): a barra não pode mais sobrepor conteúdo.
    Column(
        modifier = Modifier.fillMaxSize().padding(contentPadding).padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SavroText("Home", style = SavroTextStyle.Headline)
            SavroIconButton(
                icon = if (ocultarValores) SavroIcon.MostrarValores else SavroIcon.OcultarValores,
                contentDescription = if (ocultarValores) "Mostrar valores" else "Ocultar valores",
                onClick = aoAlternarOcultarValores,
            )
        }

        if (itens.isEmpty()) {
            SavroStatePanel(
                state = SavroState.Empty,
                title = "Sem patrimônio cadastrado ainda",
                message = "Adicione o primeiro item para ver seu patrimônio consolidado.",
                icon = SavroIcon.EstadoVazio,
                action = { BotaoAdicionarItem(aoCriar) },
            )
            return
        }

        if (!resumo.consolidavel) {
            SavroStatePanel(
                state = SavroState.Offline,
                title = "Totais não consolidados",
                message = "Há itens em moedas diferentes — cada moeda aparece separada abaixo.",
                icon = SavroIcon.EstadoOffline,
            )
        }

        // Líquido é o número hero (protótipo tela 07); bruto/dívidas viram o split secundário
        // abaixo — mesma origem de dado (`total.*Centavos`), só ordem/ênfase de apresentação
        // invertida (#220, item 15).
        resumo.totaisPorMoeda.forEach { total ->
            SavroCard(modifier = Modifier.fillMaxWidth()) {
                if (!resumo.consolidavel) SavroText(total.moeda, style = SavroTextStyle.Label)
                LinhaValor("Patrimônio líquido", total.liquidoCentavos, total.moeda, ocultarValores, destaque = true)
                SavroDivider(modifier = Modifier.padding(vertical = SavroThemeTokens.spacing.sm))
                LinhaValor("Patrimônio bruto", total.brutoCentavos, total.moeda, ocultarValores)
                LinhaValor("Dívidas", total.dividasCentavos, total.moeda, ocultarValores)
            }
        }

        SavroButton(
            label = "Adicionar item",
            onClick = aoCriar,
            modifier = Modifier.fillMaxWidth(),
            loadingStateDescription = "",
        )

        dataUltimaAtualizacao?.let {
            SavroText(
                "Última atualização: ${FormatadorData.paraDataCurta(it)}",
                style = SavroTextStyle.BodySmall,
            )
        }

        // Donut chart com legenda (`charts.html`: nunca só texto) no lugar de "Tipo — X%" em
        // texto puro — mesmos dados de `CalculoPatrimonio.distribuicaoPorClasse` (#220, item 16).
        if (distribuicoes.isNotEmpty()) {
            SavroText("Distribuição por classe", style = SavroTextStyle.Title)
            distribuicoes.forEach { distribuicao ->
                Column {
                    if (!resumo.consolidavel) SavroText(distribuicao.moeda, style = SavroTextStyle.Label)
                    SavroDonutChart(
                        slices = distribuicao.fatias.map { fatia ->
                            SavroDonutSlice(
                                label = rotuloDoTipo(fatia.tipo),
                                percentualBasisPoints = fatia.percentualBasisPoints,
                                color = corDoTipo(fatia.tipo),
                            )
                        },
                    )
                }
            }
        }

        if (itensDesatualizados.isNotEmpty()) {
            SavroText("Itens que precisam de atualização", style = SavroTextStyle.Title)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.xs)) {
                items(itensDesatualizados, key = { it.id }) { item ->
                    LinhaItemDesatualizado(nome = item.nome, aoAbrir = { aoAbrirItem(item.id) })
                }
            }
        }
    }
}

/** Linha compacta — dot colorido + texto + chevron (protótipo: nunca card pesado) — #220, item 18. */
@Composable
private fun LinhaItemDesatualizado(nome: String, aoAbrir: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth()
            .clickable(onClick = aoAbrir)
            .padding(vertical = SavroThemeTokens.spacing.xs),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
        ) {
            Box(
                modifier = Modifier
                    .size(SavroThemeTokens.spacing.xs)
                    .background(color = SavroThemeTokens.colors.warning, shape = CircleShape),
            )
            SavroText(nome, style = SavroTextStyle.Body)
        }
        SavroInlineIcon(icon = SavroIcon.Avancar)
    }
}

@Composable
private fun BotaoAdicionarItem(aoCriar: () -> Unit) {
    SavroButton(label = "Adicionar item", onClick = aoCriar, loadingStateDescription = "")
}

@Composable
private fun LinhaValor(rotulo: String, valorCentavos: Long, moeda: String, oculto: Boolean, destaque: Boolean = false) {
    val valorFormatado = "${ConversorMonetario.centavosParaTexto(valorCentavos)} $moeda"
    val texto = ApresentacaoValor.texto(valorFormatado, oculto)
    val descricao = ApresentacaoValor.descricaoAcessibilidade("$rotulo: $valorFormatado", oculto)

    Row(
        modifier = Modifier.fillMaxWidth().semantics { contentDescription = descricao },
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        SavroText(rotulo, style = if (destaque) SavroTextStyle.Title else SavroTextStyle.Body)
        SavroText(texto, style = if (destaque) SavroTextStyle.Display else SavroTextStyle.Body)
    }
}

/**
 * Cores semânticas por tipo no donut (`charts.html`: "azul primary, laranja só um destaque,
 * verde/vermelho para performance") — reaproveita tokens existentes, nenhum hex novo (#220, item 5/16).
 */
@Composable
private fun corDoTipo(tipo: TipoItemPatrimonial): Color = when (tipo) {
    TipoItemPatrimonial.CONTA -> SavroThemeTokens.colors.info
    TipoItemPatrimonial.RENDA_VARIAVEL -> SavroThemeTokens.colors.info
    TipoItemPatrimonial.RENDA_FIXA -> SavroThemeTokens.colors.success
    TipoItemPatrimonial.CRIPTO -> SavroThemeTokens.colors.warning
    TipoItemPatrimonial.BEM -> SavroThemeTokens.colors.contentMuted
    TipoItemPatrimonial.DIVIDA -> SavroThemeTokens.colors.warning
    TipoItemPatrimonial.OUTRO -> SavroThemeTokens.colors.contentMuted
}
