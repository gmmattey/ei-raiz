package io.savro.app

import androidx.compose.foundation.layout.Arrangement
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
import io.savro.app.recursos.protecao_botao_ativar
import io.savro.app.recursos.protecao_botao_continuar_sem
import io.savro.app.recursos.protecao_corpo
import io.savro.app.recursos.protecao_titulo
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroText
import io.savro.designsystem.componentes.SavroTextStyle
import io.savro.designsystem.tema.SavroThemeTokens
import io.savro.security.GerenciadorCofre
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

/**
 * Onboarding em até três etapas (#118, critério de aceite "primeira abertura sem dado pessoal"):
 * explica dados locais, ausência de conta e ausência de recuperação online sem backup — sem
 * pedir e-mail, CPF, senha de servidor ou permissão prematura.
 */
private enum class EtapaOnboarding(val titulo: StringResource, val corpo: StringResource) {
    LOCAL(Res.string.onboarding_etapa1_titulo, Res.string.onboarding_etapa1_corpo),
    SEM_CONTA(Res.string.onboarding_etapa2_titulo, Res.string.onboarding_etapa2_corpo),
    SEM_RECUPERACAO(Res.string.onboarding_etapa3_titulo, Res.string.onboarding_etapa3_corpo),
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
        SavroText(stringResource(etapa.titulo), style = SavroTextStyle.Headline)
        SavroText(stringResource(etapa.corpo), style = SavroTextStyle.Body)

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

/**
 * Oferece a proteção (biometria/credencial de dispositivo) logo após a explicação, com opção
 * explícita de continuar sem ela (#118: "Permitir continuar sem biometria, com aviso claro").
 */
@Composable
private fun TelaEscolherProtecao(gerenciador: GerenciadorCofre, aoConcluir: () -> Unit) {
    val escopo = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md),
        verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.lg),
    ) {
        SavroText(stringResource(Res.string.protecao_titulo), style = SavroTextStyle.Headline)
        SavroText(stringResource(Res.string.protecao_corpo), style = SavroTextStyle.Body)

        SavroButton(
            label = stringResource(Res.string.protecao_botao_ativar),
            onClick = {
                escopo.launch {
                    gerenciador.ativarProtecao()
                    gerenciador.marcarOnboardingConcluido()
                    aoConcluir()
                }
            },
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
        SavroButton(
            label = stringResource(Res.string.protecao_botao_continuar_sem),
            onClick = {
                escopo.launch {
                    gerenciador.marcarOnboardingConcluido()
                    aoConcluir()
                }
            },
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
