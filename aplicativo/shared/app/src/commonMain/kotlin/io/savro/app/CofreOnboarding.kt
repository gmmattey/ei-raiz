package io.savro.app

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import io.savro.app.recursos.Res
import io.savro.app.recursos.onboarding_botao_continuar
import io.savro.app.recursos.onboarding_botao_proximo
import io.savro.app.recursos.onboarding_botao_voltar
import io.savro.app.recursos.onboarding_etapa1_corpo
import io.savro.app.recursos.onboarding_etapa1_titulo
import io.savro.app.recursos.onboarding_etapa2_corpo
import io.savro.app.recursos.onboarding_etapa2_titulo
import io.savro.app.recursos.onboarding_etapa3_corpo
import io.savro.app.recursos.onboarding_etapa3_titulo
import io.savro.app.recursos.onboarding_link_pular
import io.savro.app.recursos.protecao_aviso_backup
import io.savro.app.recursos.protecao_botao_continuar
import io.savro.app.recursos.protecao_checkbox_responsabilidade
import io.savro.app.recursos.protecao_corpo
import io.savro.app.recursos.protecao_opcao_biometria
import io.savro.app.recursos.protecao_opcao_credencial
import io.savro.app.recursos.protecao_opcao_sem_bloqueio
import io.savro.app.recursos.protecao_titulo
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCheckboxRow
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.componentes.SavroIllustrationPlaceholder
import io.savro.designsystem.componentes.SavroProgressDots
import io.savro.designsystem.componentes.SavroRadioOptionCard
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.componentes.SavroWarningBanner
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.security.GerenciadorCofre
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

/**
 * Onboarding em até três etapas (#118, critério de aceite "primeira abertura sem dado pessoal"):
 * explica dados locais, ausência de conta e ausência de recuperação online sem backup — sem
 * pedir e-mail, CPF, senha de servidor ou permissão prematura. Copy das etapas não muda na
 * auditoria #220 (item 7) — só ganham ilustração (placeholder, sem asset real no repo), link
 * "Pular" e indicador de progresso, alinhado ao protótipo (telas 02-04).
 */
private enum class EtapaOnboarding(val titulo: StringResource, val corpo: StringResource, val ilustracao: SavroIcon) {
    LOCAL(Res.string.onboarding_etapa1_titulo, Res.string.onboarding_etapa1_corpo, SavroIcon.IlustracaoDadosLocais),
    SEM_CONTA(Res.string.onboarding_etapa2_titulo, Res.string.onboarding_etapa2_corpo, SavroIcon.IlustracaoSemConta),
    SEM_RECUPERACAO(Res.string.onboarding_etapa3_titulo, Res.string.onboarding_etapa3_corpo, SavroIcon.IlustracaoSemRecuperacao),
}

@Composable
internal fun TelaOnboarding(gerenciador: GerenciadorCofre, aoConcluir: () -> Unit) {
    var etapa by remember { mutableStateOf(EtapaOnboarding.LOCAL) }
    var mostrarEscolhaDeProtecao by remember { mutableStateOf(false) }

    if (mostrarEscolhaDeProtecao) {
        TelaEscolherProtecao(gerenciador = gerenciador, aoConcluir = aoConcluir)
        return
    }

    val etapas = EtapaOnboarding.entries
    val indice = etapas.indexOf(etapa)
    val ultimaEtapa = indice == etapas.lastIndex

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.lg),
    ) {
        // Skip pula direto para a escolha de proteção (protótipo telas 02-04) — #220, item 7.
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.TopEnd) {
            SavroText(
                text = stringResource(Res.string.onboarding_link_pular),
                style = SavroTextStyle.Label,
                modifier = Modifier.clickable { mostrarEscolhaDeProtecao = true },
            )
        }

        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            SavroIllustrationPlaceholder(icon = etapa.ilustracao)
        }

        SavroText(stringResource(etapa.titulo), style = SavroTextStyle.Headline)
        SavroText(stringResource(etapa.corpo), style = SavroTextStyle.Body)

        SavroProgressDots(total = etapas.size, indiceAtual = indice)

        SavroButton(
            label = stringResource(if (ultimaEtapa) Res.string.onboarding_botao_continuar else Res.string.onboarding_botao_proximo),
            onClick = {
                if (ultimaEtapa) {
                    mostrarEscolhaDeProtecao = true
                } else {
                    etapa = etapas[indice + 1]
                }
            },
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )

        if (indice > 0) {
            SavroButton(
                label = stringResource(Res.string.onboarding_botao_voltar),
                onClick = { etapa = etapas[indice - 1] },
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

private enum class OpcaoProtecao { Biometria, Credencial, SemBloqueio }

/**
 * Escolha de proteção (protótipo tela 05: 3 opções em rádio, banner de aviso e checkbox
 * obrigatório habilitando "Continuar" — #220, item 8). Reaproveita
 * `PoliticaProtecao.Ativada.permitirCredencialDispositivo` já existente no domínio: Biometria ==
 * `permitirCredencialDispositivo = false`, Credencial do aparelho ==
 * `permitirCredencialDispositivo = true` — nenhum estado de domínio novo foi criado.
 *
 * Pendência real (registrada, não resolvida aqui): não há contrato disponível para checar se o
 * aparelho tem biometria configurada sem mudar `GerenciadorCofre`/`AutenticadorBiometrico` — as
 * três opções ficam sempre habilitadas, diferente do protótipo ("sem biometria → opção
 * desabilitada, com nota").
 */
@Composable
private fun TelaEscolherProtecao(gerenciador: GerenciadorCofre, aoConcluir: () -> Unit) {
    val escopo = rememberCoroutineScope()
    var opcao by remember { mutableStateOf(OpcaoProtecao.Biometria) }
    var confirmouResponsabilidade by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.md),
    ) {
        SavroText(stringResource(Res.string.protecao_titulo), style = SavroTextStyle.Headline)
        SavroText(stringResource(Res.string.protecao_corpo), style = SavroTextStyle.Body)

        SavroRadioOptionCard(
            label = stringResource(Res.string.protecao_opcao_biometria),
            selected = opcao == OpcaoProtecao.Biometria,
            onClick = { opcao = OpcaoProtecao.Biometria },
        )
        SavroRadioOptionCard(
            label = stringResource(Res.string.protecao_opcao_credencial),
            selected = opcao == OpcaoProtecao.Credencial,
            onClick = { opcao = OpcaoProtecao.Credencial },
        )
        SavroRadioOptionCard(
            label = stringResource(Res.string.protecao_opcao_sem_bloqueio),
            selected = opcao == OpcaoProtecao.SemBloqueio,
            onClick = { opcao = OpcaoProtecao.SemBloqueio },
        )

        SavroWarningBanner(message = stringResource(Res.string.protecao_aviso_backup))

        SavroCheckboxRow(
            checked = confirmouResponsabilidade,
            onCheckedChange = { confirmouResponsabilidade = it },
            label = stringResource(Res.string.protecao_checkbox_responsabilidade),
        )

        SavroButton(
            label = stringResource(Res.string.protecao_botao_continuar),
            enabled = confirmouResponsabilidade,
            onClick = {
                escopo.launch {
                    when (opcao) {
                        OpcaoProtecao.Biometria -> gerenciador.ativarProtecao(permitirCredencialDispositivo = false)
                        OpcaoProtecao.Credencial -> gerenciador.ativarProtecao(permitirCredencialDispositivo = true)
                        OpcaoProtecao.SemBloqueio -> Unit
                    }
                    gerenciador.marcarOnboardingConcluido()
                    aoConcluir()
                }
            },
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
