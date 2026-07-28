package io.savro.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import io.savro.app.recursos.Res
import io.savro.app.recursos.cofre_biometria_indisponivel_mensagem
import io.savro.app.recursos.cofre_biometria_indisponivel_titulo
import io.savro.app.recursos.cofre_bloqueio_temporario_mensagem
import io.savro.app.recursos.cofre_bloqueio_temporario_titulo
import io.savro.app.recursos.cofre_botao_continuar_sem_protecao
import io.savro.app.recursos.cofre_botao_entendi
import io.savro.app.recursos.cofre_botao_tentar_novamente
import io.savro.app.recursos.cofre_chave_invalidada_mensagem
import io.savro.app.recursos.cofre_chave_invalidada_titulo
import io.savro.app.recursos.cofre_credencial_invalida_mensagem
import io.savro.app.recursos.cofre_credencial_invalida_titulo
import io.savro.app.recursos.cofre_descriptografando_mensagem
import io.savro.app.recursos.cofre_descriptografando_titulo
import io.savro.app.recursos.cofre_erro_mensagem
import io.savro.app.recursos.cofre_erro_titulo
import io.savro.app.recursos.cofre_restauracao_mensagem
import io.savro.app.recursos.cofre_restauracao_titulo
import io.savro.app.recursos.configuracao_protecao_botao_ativar
import io.savro.app.recursos.configuracao_protecao_botao_fechar
import io.savro.app.recursos.configuracao_protecao_botao_remover
import io.savro.app.recursos.configuracao_protecao_estado_ativada
import io.savro.app.recursos.configuracao_protecao_estado_desativada
import io.savro.app.recursos.configuracao_protecao_permitir_credencial
import io.savro.app.recursos.configuracao_protecao_titulo
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroFilterChip
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.componentes.SavroState
import io.savro.designsystem.componentes.SavroStatePanel
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.security.EstadoCofre
import io.savro.security.GerenciadorCofre
import io.savro.security.PoliticaProtecao
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/** Despacha a UI a partir do [EstadoCofre] atual — os 8 estados obrigatórios da #118. */
@Composable
internal fun TelaCofre(gerenciador: GerenciadorCofre, servicoPatrimonio: ServicoPatrimonio) {
    val estado by gerenciador.estado.collectAsState()
    val escopo = rememberCoroutineScope()

    when (val atual = estado) {
        EstadoCofre.Descriptografando -> SavroStatePanel(
            state = SavroState.Loading,
            title = stringResource(Res.string.cofre_descriptografando_titulo),
            message = stringResource(Res.string.cofre_descriptografando_mensagem),
        )

        EstadoCofre.Desbloqueado -> TelaHome(gerenciador, servicoPatrimonio)

        is EstadoCofre.CredencialInvalida -> SavroStatePanel(
            state = SavroState.Error,
            title = stringResource(Res.string.cofre_credencial_invalida_titulo),
            message = stringResource(Res.string.cofre_credencial_invalida_mensagem),
            icon = SavroIcon.EstadoErro,
            action = { BotaoTentarNovamente(gerenciador) },
        )

        EstadoCofre.BiometriaIndisponivel -> SavroStatePanel(
            state = SavroState.Error,
            title = stringResource(Res.string.cofre_biometria_indisponivel_titulo),
            message = stringResource(Res.string.cofre_biometria_indisponivel_mensagem),
            icon = SavroIcon.EstadoErro,
            action = {
                Column(verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
                    BotaoTentarNovamente(gerenciador)
                    SavroButton(
                        label = stringResource(Res.string.cofre_botao_continuar_sem_protecao),
                        onClick = { escopo.launch { gerenciador.removerProtecao(); gerenciador.tentarNovamente() } },
                        style = SavroButtonStyle.Secondary,
                        loadingStateDescription = "",
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            },
        )

        is EstadoCofre.BloqueioTemporario -> SavroStatePanel(
            state = SavroState.Offline,
            title = stringResource(Res.string.cofre_bloqueio_temporario_titulo),
            message = stringResource(Res.string.cofre_bloqueio_temporario_mensagem),
            icon = SavroIcon.EstadoOffline,
            action = { BotaoTentarNovamente(gerenciador) },
        )

        is EstadoCofre.ChaveInvalidada -> SavroStatePanel(
            state = SavroState.Error,
            title = stringResource(Res.string.cofre_chave_invalidada_titulo),
            message = stringResource(Res.string.cofre_chave_invalidada_mensagem),
            icon = SavroIcon.EstadoErro,
            action = {
                SavroButton(
                    label = stringResource(Res.string.cofre_botao_entendi),
                    onClick = gerenciador::reconhecerChaveInvalidada,
                    loadingStateDescription = "",
                    modifier = Modifier.fillMaxWidth(),
                )
            },
        )

        EstadoCofre.RestauracaoNecessaria -> SavroStatePanel(
            state = SavroState.Error,
            title = stringResource(Res.string.cofre_restauracao_titulo),
            message = stringResource(Res.string.cofre_restauracao_mensagem),
            icon = SavroIcon.EstadoErro,
        )

        is EstadoCofre.ErroRecuperavel -> SavroStatePanel(
            state = SavroState.Error,
            title = stringResource(Res.string.cofre_erro_titulo),
            message = stringResource(Res.string.cofre_erro_mensagem),
            icon = SavroIcon.EstadoErro,
            action = { BotaoTentarNovamente(gerenciador) },
        )
    }
}

@Composable
private fun BotaoTentarNovamente(gerenciador: GerenciadorCofre) {
    SavroButton(
        label = stringResource(Res.string.cofre_botao_tentar_novamente),
        onClick = gerenciador::tentarNovamente,
        loadingStateDescription = "",
        modifier = Modifier.fillMaxWidth(),
    )
}

/**
 * Destino pós-onboarding/desbloqueio: [TelaPatrimonio] (em `PatrimonioScreens.kt`) hospeda a
 * experiência principal completa (#120) — Home, Patrimônio e Detalhe, todos sobre a mesma
 * instância de [servicoPatrimonio]. Acesso a ativar/alterar/remover a proteção do cofre (#118)
 * continua disponível a partir daqui.
 */
@Composable
private fun TelaHome(gerenciador: GerenciadorCofre, servicoPatrimonio: ServicoPatrimonio) {
    var mostrarConfiguracaoProtecao by remember { mutableStateOf(false) }

    if (mostrarConfiguracaoProtecao) {
        TelaConfiguracaoProtecao(gerenciador = gerenciador, aoFechar = { mostrarConfiguracaoProtecao = false })
        return
    }

    TelaPatrimonio(
        servico = servicoPatrimonio,
        aoAbrirConfiguracaoProtecao = { mostrarConfiguracaoProtecao = true },
    )
}

/** Permite ativar, alterar e remover a proteção do cofre (#118, critério de aceite obrigatório). */
@Composable
private fun TelaConfiguracaoProtecao(gerenciador: GerenciadorCofre, aoFechar: () -> Unit) {
    val escopo = rememberCoroutineScope()
    var politica by remember { mutableStateOf<PoliticaProtecao?>(null) }

    LaunchedEffect(gerenciador) { politica = gerenciador.politicaAtual() }

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.lg),
    ) {
        SavroText(stringResource(Res.string.configuracao_protecao_titulo), style = SavroTextStyle.Headline)

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

        SavroButton(
            label = stringResource(Res.string.configuracao_protecao_botao_fechar),
            onClick = aoFechar,
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
