package io.savro.designsystem.componentes

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddCircleOutline
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.NoAccounts
import androidx.compose.material.icons.filled.SearchOff
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material.icons.filled.SyncAlt
import androidx.compose.material.icons.filled.Unarchive
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Vocabulário fechado de ícones do design system. `:shared:app` só conhece este enum — nunca
 * `androidx.compose.material.icons.*` diretamente (mesma fronteira da ADR-002 já aplicada a
 * [SavroTextStyle]/[SavroButtonStyle]). Adicionar um ícone novo aqui, nunca importar o pacote de
 * ícones fora do designsystem.
 */
enum class SavroIcon {
    Voltar,
    MaisOpcoes,
    Adicionar,
    MostrarValores,
    OcultarValores,
    Home,
    Patrimonio,
    Ajustes,
    Excluir,
    Avancar,
    // Placeholders neutros para as ilustrações de onboarding (#220, item 7) — não existe asset de
    // ilustração (`illus-onb-*.svg`) no repo, registrado como pendência no PR.
    IlustracaoDadosLocais,
    IlustracaoSemConta,
    IlustracaoSemRecuperacao,
    // Ícones de estado (#220, item 13 — SavroStatePanel ganha ícone opcional).
    EstadoVazio,
    EstadoErro,
    EstadoOffline,
    EstadoCarregando,
    EstadoBuscaSemResultado,
    EstadoArquivado,
    // Ícones por tipo de evento da timeline (#220, item 20 — nice-to-have).
    EventoCriado,
    EventoValorAjustado,
    EventoEditado,
    EventoArquivado,
    EventoReativado,
}

internal fun SavroIcon.paraImageVector(): ImageVector = when (this) {
    SavroIcon.Voltar -> Icons.AutoMirrored.Filled.ArrowBack
    SavroIcon.MaisOpcoes -> Icons.Filled.MoreVert
    SavroIcon.Adicionar -> Icons.Filled.Add
    SavroIcon.MostrarValores -> Icons.Filled.Visibility
    SavroIcon.OcultarValores -> Icons.Filled.VisibilityOff
    SavroIcon.Home -> Icons.Filled.Home
    SavroIcon.Patrimonio -> Icons.Filled.AccountBalanceWallet
    SavroIcon.Ajustes -> Icons.Filled.Settings
    SavroIcon.Excluir -> Icons.Filled.Delete
    SavroIcon.Avancar -> Icons.AutoMirrored.Filled.KeyboardArrowRight
    SavroIcon.IlustracaoDadosLocais -> Icons.Filled.Storage
    SavroIcon.IlustracaoSemConta -> Icons.Filled.NoAccounts
    SavroIcon.IlustracaoSemRecuperacao -> Icons.Filled.CloudOff
    SavroIcon.EstadoVazio -> Icons.Filled.Inventory2
    SavroIcon.EstadoErro -> Icons.Filled.ErrorOutline
    SavroIcon.EstadoOffline -> Icons.Filled.WifiOff
    SavroIcon.EstadoCarregando -> Icons.Filled.HourglassEmpty
    SavroIcon.EstadoBuscaSemResultado -> Icons.Filled.SearchOff
    SavroIcon.EstadoArquivado -> Icons.Filled.SwapVert
    SavroIcon.EventoCriado -> Icons.Filled.AddCircleOutline
    SavroIcon.EventoValorAjustado -> Icons.Filled.SyncAlt
    SavroIcon.EventoEditado -> Icons.Filled.Edit
    SavroIcon.EventoArquivado -> Icons.Filled.Archive
    SavroIcon.EventoReativado -> Icons.Filled.Unarchive
}
