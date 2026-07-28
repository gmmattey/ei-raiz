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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroCardTone
import io.savro.designsystem.componentes.SavroDivider
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

/**
 * Home (issue #120): patrimônio bruto, dívidas, patrimônio líquido, distribuição básica por
 * classe, data da última atualização, itens que precisam de atualização e a ação principal de
 * adicionar item. Usa exatamente [CalculoPatrimonio] — o mesmo motor de cálculo consumido por
 * Patrimônio e Detalhe (nenhuma soma/porcentagem é recalculada de outra forma aqui).
 */
@Composable
internal fun TelaHomeResumo(
    servico: ServicoPatrimonio,
    ocultarValores: Boolean,
    aoAlternarOcultarValores: () -> Unit,
    aoCriar: () -> Unit,
    aoAbrirItem: (String) -> Unit,
) {
    val itens by servico.itens.collectAsState()
    val resumo = remember(itens) { CalculoPatrimonio.resumo(itens) }
    val distribuicoes = remember(itens) { CalculoPatrimonio.distribuicaoPorClasse(itens) }
    val dataUltimaAtualizacao = remember(itens) { CalculoPatrimonio.dataUltimaAtualizacao(itens) }
    val itensDesatualizados = remember(itens) {
        CalculoPatrimonio.itensQuePrecisamAtualizacao(itens, agoraEpocaMs = servico.agoraEmEpocaMs())
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            SavroText("Home", style = SavroTextStyle.Headline)
            SavroButton(
                label = if (ocultarValores) "Mostrar valores" else "Ocultar valores",
                onClick = aoAlternarOcultarValores,
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
        }

        if (itens.isEmpty()) {
            SavroStatePanel(
                state = SavroState.Empty,
                title = "Sem patrimônio cadastrado ainda",
                message = "Adicione o primeiro item para ver seu patrimônio consolidado.",
                action = { BotaoAdicionarItem(aoCriar) },
            )
            return
        }

        if (!resumo.consolidavel) {
            SavroStatePanel(
                state = SavroState.Offline,
                title = "Totais não consolidados",
                message = "Há itens em moedas diferentes — cada moeda aparece separada abaixo.",
            )
        }

        resumo.totaisPorMoeda.forEach { total ->
            SavroCard(modifier = Modifier.fillMaxWidth()) {
                if (!resumo.consolidavel) SavroText(total.moeda, style = SavroTextStyle.Label)
                LinhaValor("Patrimônio bruto", total.brutoCentavos, total.moeda, ocultarValores)
                LinhaValor("Dívidas", total.dividasCentavos, total.moeda, ocultarValores)
                SavroDivider(modifier = Modifier.padding(vertical = SavroThemeTokens.spacing.sm))
                LinhaValor("Patrimônio líquido", total.liquidoCentavos, total.moeda, ocultarValores, destaque = true)
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

        if (distribuicoes.isNotEmpty()) {
            SavroText("Distribuição por classe", style = SavroTextStyle.Title)
            distribuicoes.forEach { distribuicao ->
                SavroCard(modifier = Modifier.fillMaxWidth()) {
                    if (!resumo.consolidavel) SavroText(distribuicao.moeda, style = SavroTextStyle.Label)
                    distribuicao.fatias.forEach { fatia ->
                        SavroText(
                            "${rotuloDoTipo(fatia.tipo)} — ${fatia.percentualBasisPoints / 100}%",
                            style = SavroTextStyle.BodySmall,
                        )
                    }
                }
            }
        }

        if (itensDesatualizados.isNotEmpty()) {
            SavroText("Itens que precisam de atualização", style = SavroTextStyle.Title)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                items(itensDesatualizados, key = { it.id }) { item ->
                    SavroCard(modifier = Modifier.fillMaxWidth(), tone = SavroCardTone.Offline) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            SavroText(item.nome, style = SavroTextStyle.Body)
                            SavroButton(
                                label = "Ver",
                                onClick = { aoAbrirItem(item.id) },
                                style = SavroButtonStyle.Secondary,
                                loadingStateDescription = "",
                            )
                        }
                    }
                }
            }
        }
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
        SavroText(rotulo, style = SavroTextStyle.Body)
        SavroText(texto, style = if (destaque) SavroTextStyle.Title else SavroTextStyle.Body)
    }
}
