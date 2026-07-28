package io.savro.designsystem.componentes

import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.border
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.input.VisualTransformation
import io.savro.designsystem.tema.SavroThemeTokens

enum class SavroButtonStyle { Primary, Secondary, Destructive }
enum class SavroCardTone { Standard, Error, Offline, Hidden }
enum class SavroTextStyle { Display, Headline, Title, Body, BodySmall, Label }

/**
 * Texto do design system. Existe para que `:shared:app` nunca precise importar Material 3
 * diretamente — a fronteira exigida pela ADR-002.
 */
@Composable
fun SavroText(
    text: String,
    modifier: Modifier = Modifier,
    style: SavroTextStyle = SavroTextStyle.Body,
) {
    val textStyle = when (style) {
        SavroTextStyle.Display -> MaterialTheme.typography.displaySmall
        SavroTextStyle.Headline -> MaterialTheme.typography.headlineSmall
        SavroTextStyle.Title -> MaterialTheme.typography.titleMedium
        SavroTextStyle.Body -> MaterialTheme.typography.bodyMedium
        SavroTextStyle.BodySmall -> MaterialTheme.typography.bodySmall
        SavroTextStyle.Label -> MaterialTheme.typography.labelMedium
    }
    Text(text = text, modifier = modifier, style = textStyle)
}

@Composable
fun SavroSurface(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.background,
        contentColor = MaterialTheme.colorScheme.onBackground,
        content = content,
    )
}

@Composable
fun SavroCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(SavroThemeTokens.spacing.md),
    tone: SavroCardTone = SavroCardTone.Standard,
    content: @Composable ColumnScope.() -> Unit,
) {
    val containerColor = when (tone) {
        SavroCardTone.Standard -> MaterialTheme.colorScheme.surface
        SavroCardTone.Error -> MaterialTheme.colorScheme.errorContainer
        SavroCardTone.Offline -> MaterialTheme.colorScheme.secondaryContainer
        SavroCardTone.Hidden -> MaterialTheme.colorScheme.surfaceVariant
    }
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = SavroThemeTokens.elevations.card),
        shape = MaterialTheme.shapes.medium,
    ) {
        Column(modifier = Modifier.padding(contentPadding), content = content)
    }
}

@Composable
fun SavroButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    loadingStateDescription: String,
    style: SavroButtonStyle = SavroButtonStyle.Primary,
) {
    val effectiveEnabled = enabled && !loading
    val colors = when (style) {
        SavroButtonStyle.Primary -> ButtonDefaults.buttonColors()
        SavroButtonStyle.Secondary -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer,
            contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
        )
        SavroButtonStyle.Destructive -> ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
            contentColor = MaterialTheme.colorScheme.onError,
        )
    }
    val loadingColor = when (style) {
        SavroButtonStyle.Primary -> MaterialTheme.colorScheme.onPrimary
        SavroButtonStyle.Secondary -> MaterialTheme.colorScheme.onSecondaryContainer
        SavroButtonStyle.Destructive -> MaterialTheme.colorScheme.onError
    }

    Button(
        onClick = onClick,
        modifier = modifier
            .heightIn(min = SavroThemeTokens.components.buttonMinHeight)
            .semantics { if (loading) stateDescription = loadingStateDescription },
        enabled = effectiveEnabled,
        colors = colors,
        shape = MaterialTheme.shapes.small,
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(SavroThemeTokens.components.buttonLoadingIndicatorSize),
                color = loadingColor,
                strokeWidth = SavroThemeTokens.components.buttonLoadingIndicatorStroke,
            )
        } else {
            Text(text = label, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SavroTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    supportingText: String? = null,
    isError: Boolean = false,
    enabled: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        enabled = enabled,
        isError = isError,
        label = { Text(text = label, style = MaterialTheme.typography.labelMedium) },
        placeholder = placeholder?.let { { Text(text = it, style = MaterialTheme.typography.bodyMedium) } },
        supportingText = supportingText?.let { { Text(text = it, style = MaterialTheme.typography.bodySmall) } },
        visualTransformation = visualTransformation,
        shape = MaterialTheme.shapes.small,
    )
}

@Composable
fun SavroFilterChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        label = { Text(text = label, style = MaterialTheme.typography.labelMedium) },
    )
}

@Composable
fun SavroDivider(modifier: Modifier = Modifier) {
    HorizontalDivider(modifier = modifier, color = MaterialTheme.colorScheme.outlineVariant)
}

/** Ícone inline, não-clicável (linha compacta de item desatualizado, evento de timeline). */
@Composable
fun SavroInlineIcon(icon: SavroIcon, modifier: Modifier = Modifier) {
    Icon(
        imageVector = icon.paraImageVector(),
        contentDescription = null,
        modifier = modifier,
        tint = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

/**
 * Botão-ícone circular (`buttons.html`: btn-icon 48x48, radius 12, gradient navy escuro). Usado
 * para ações compactas em barras/cards (voltar, menu de opções) que antes viravam texto solto
 * (auditoria #220, item 1).
 */
@Composable
fun SavroIconButton(
    icon: SavroIcon,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    IconButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .size(SavroThemeTokens.components.iconButtonSize)
            .clip(MaterialTheme.shapes.small)
            .background(SavroThemeTokens.gradients.iconButton),
    ) {
        Icon(
            imageVector = icon.paraImageVector(),
            contentDescription = contentDescription,
            tint = MaterialTheme.colorScheme.onSurface,
        )
    }
}

/**
 * FAB principal (`buttons.html`/`tokens.html`: 56x56, radius 18 — reaproveita `shapes.large`,
 * já em 20dp, mais próxima do valor do design system do que qualquer primitivo existente,
 * gradient azul). Substitui os botões "Novo item"/"Adicionar item" de largura total (#220, item 2).
 */
@Composable
fun SavroFab(
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .size(SavroThemeTokens.components.fabSize)
            .clip(MaterialTheme.shapes.large)
            .background(SavroThemeTokens.gradients.primary)
            .clickable(onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = SavroIcon.Adicionar.paraImageVector(),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onPrimary,
        )
    }
}

/**
 * Opção em formato de rádio dentro de uma lista (protótipo tela 05: "Proteja seu cofre" — 3
 * opções, alvo mínimo 48dp, selecionada com borda `primary`). Usada pela escolha de proteção do
 * cofre, não exclusiva dela (#220, item 8).
 */
@Composable
fun SavroRadioOptionCard(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    supportingText: String? = null,
) {
    val borderColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = SavroThemeTokens.components.iconButtonSize)
            .clip(MaterialTheme.shapes.medium)
            .background(MaterialTheme.colorScheme.surface)
            .border(width = SavroThemeTokens.components.outlineWidth, color = borderColor, shape = MaterialTheme.shapes.medium)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(SavroThemeTokens.spacing.md),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
    ) {
        RadioButton(selected = selected, onClick = onClick, enabled = enabled, colors = RadioButtonDefaults.colors())
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.titleMedium,
                color = if (enabled) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
            )
            supportingText?.let {
                Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

/** Linha de checkbox com texto (`overlays.html`/tela 05: confirmação explícita antes de continuar). */
@Composable
fun SavroCheckboxRow(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.clickable { onCheckedChange(!checked) },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.xs),
    ) {
        Checkbox(checked = checked, onCheckedChange = onCheckedChange, colors = CheckboxDefaults.colors())
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** Banner de aviso (`overlays.html`/tokens `warning` — âmbar). Reaproveita `colors.warning`. */
@Composable
fun SavroWarningBanner(message: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = SavroThemeTokens.colors.warningBackground,
        contentColor = SavroThemeTokens.colors.warning,
        shape = MaterialTheme.shapes.medium,
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(SavroThemeTokens.spacing.md),
        )
    }
}

/** Um destino da [SavroBottomNavigation]. */
data class SavroBottomNavItem(
    val icon: SavroIcon,
    val label: String,
    val selected: Boolean,
    val onClick: () -> Unit,
)

/**
 * Navegação inferior (`navigation.html`). O protótipo mostra 4 itens, mas o MVP1 usa 3 —
 * Início/Patrimônio/Ajustes; Histórico fica de fora por ser backlog e a timeline por item já vive
 * no Detalhe (#220, item 3/14).
 */
@Composable
fun SavroBottomNavigation(items: List<SavroBottomNavItem>, modifier: Modifier = Modifier) {
    NavigationBar(modifier = modifier, containerColor = MaterialTheme.colorScheme.surface) {
        items.forEach { item ->
            NavigationBarItem(
                selected = item.selected,
                onClick = item.onClick,
                icon = { Icon(imageVector = item.icon.paraImageVector(), contentDescription = null) },
                label = { Text(text = item.label, style = MaterialTheme.typography.labelMedium) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = MaterialTheme.colorScheme.secondaryContainer,
                ),
            )
        }
    }
}

/**
 * Diálogo de confirmação destrutiva genérico (`overlays.html`). Usado antes de qualquer exclusão
 * irreversível — nenhuma tela deve chamar [io.savro.domain.patrimonio.ServicoPatrimonio.excluir]
 * sem passar por aqui (#220, item 4/10/19).
 */
@Composable
fun SavroConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String,
    cancelLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    destructive: Boolean = true,
) {
    AlertDialog(
        modifier = modifier,
        onDismissRequest = onDismiss,
        title = { Text(text = title, style = MaterialTheme.typography.titleMedium) },
        text = { Text(text = message, style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            SavroButton(
                label = confirmLabel,
                onClick = onConfirm,
                style = if (destructive) SavroButtonStyle.Destructive else SavroButtonStyle.Primary,
                loadingStateDescription = "",
            )
        },
        dismissButton = {
            SavroButton(
                label = cancelLabel,
                onClick = onDismiss,
                style = SavroButtonStyle.Secondary,
                loadingStateDescription = "",
            )
        },
    )
}

/** Uma ação do [SavroOverflowMenu]. */
data class SavroMenuAction(val label: String, val onClick: () -> Unit, val destructive: Boolean = false)

/**
 * Menu de opções acionado por um gatilho (por padrão, o botão "⋯" — `SavroIconButton`). Substitui
 * as linhas de botões sempre visíveis nos cards de patrimônio e no Detalhe (#220, item 10/19).
 * [trigger] permite reaproveitar o mesmo menu para o controle único de ordenação (item 11).
 */
@Composable
fun SavroOverflowMenu(
    actions: List<SavroMenuAction>,
    contentDescription: String,
    modifier: Modifier = Modifier,
    trigger: @Composable (abrir: () -> Unit) -> Unit = { abrir ->
        SavroIconButton(icon = SavroIcon.MaisOpcoes, contentDescription = contentDescription, onClick = abrir)
    },
) {
    var expandido by remember { mutableStateOf(false) }
    Box(modifier = modifier) {
        trigger { expandido = true }
        DropdownMenu(expanded = expandido, onDismissRequest = { expandido = false }) {
            actions.forEach { acao ->
                DropdownMenuItem(
                    text = {
                        Text(
                            text = acao.label,
                            color = if (acao.destructive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                        )
                    },
                    onClick = {
                        expandido = false
                        acao.onClick()
                    },
                )
            }
        }
    }
}

/** Uma fatia do [SavroDonutChart]. */
data class SavroDonutSlice(val label: String, val percentualBasisPoints: Int, val color: Color)

/**
 * Donut chart com legenda (`charts.html`: raio 54/stroke 18, sempre com legenda de dots+percentual
 * — nunca só texto). Substitui a distribuição por classe em texto puro (#220, item 5/16).
 */
@Composable
fun SavroDonutChart(slices: List<SavroDonutSlice>, modifier: Modifier = Modifier) {
    val total = slices.sumOf { it.percentualBasisPoints }.coerceAtLeast(1)
    val backgroundColor = MaterialTheme.colorScheme.surfaceVariant
    val donutStrokeWidth = SavroThemeTokens.components.donutStrokeWidth
    val diameter = SavroThemeTokens.components.donutRadius * 2

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm)) {
        Canvas(modifier = Modifier.size(diameter)) {
            val strokeWidthPx = donutStrokeWidth.toPx()
            val stroke = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
            val arcSize = Size(size.width - strokeWidthPx, size.height - strokeWidthPx)
            val topLeft = androidx.compose.ui.geometry.Offset(strokeWidthPx / 2, strokeWidthPx / 2)
            drawArc(
                color = backgroundColor,
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = stroke,
            )
            var anguloInicial = -90f
            slices.forEach { fatia ->
                val varredura = 360f * fatia.percentualBasisPoints / total
                drawArc(
                    color = fatia.color,
                    startAngle = anguloInicial,
                    sweepAngle = varredura,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = stroke,
                )
                anguloInicial += varredura
            }
        }

        slices.forEach { fatia ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.xs),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(SavroThemeTokens.spacing.xs)
                        .background(color = fatia.color, shape = androidx.compose.foundation.shape.CircleShape),
                )
                SavroText("${fatia.label} — ${fatia.percentualBasisPoints / 100}%", style = SavroTextStyle.BodySmall)
            }
        }
    }
}

/**
 * Placeholder neutro para as ilustrações do onboarding/estados vazios quando não existe asset de
 * arte finalizada no repo (`illus-onb-*.svg`/`illus-home-empty.svg` não existem em
 * `documentacao/marca` — auditoria #220, item 7). Círculo com ícone, nunca "inventa" a arte real.
 */
@Composable
fun SavroIllustrationPlaceholder(icon: SavroIcon, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(SavroThemeTokens.spacing.xxxl * 2)
            .clip(androidx.compose.foundation.shape.CircleShape)
            .background(MaterialTheme.colorScheme.surfaceVariant),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon.paraImageVector(),
            contentDescription = null,
            modifier = Modifier.size(SavroThemeTokens.spacing.xxl),
            tint = MaterialTheme.colorScheme.secondary,
        )
    }
}

/** Indicador de progresso em pontos (onboarding, protótipo telas 02-04) — #220, item 7. */
@Composable
fun SavroProgressDots(total: Int, indiceAtual: Int, modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.xs)) {
        repeat(total) { indice ->
            val ativo = indice == indiceAtual
            Box(
                modifier = Modifier
                    .size(SavroThemeTokens.spacing.xs)
                    .background(
                        color = if (ativo) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                        shape = androidx.compose.foundation.shape.CircleShape,
                    ),
            )
        }
    }
}

enum class SavroState { Loading, Empty, Error, Offline, Hidden }

@Composable
fun SavroPrivacyMask(
    isVisible: Boolean,
    hiddenContentDescription: String,
    modifier: Modifier = Modifier,
    content: @Composable (Modifier) -> Unit,
) {
    if (isVisible) {
        content(modifier)
    } else {
        Surface(
            modifier = modifier,
            color = MaterialTheme.colorScheme.surfaceVariant,
            contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
        ) {
            Text(text = hiddenContentDescription, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

/**
 * `icon` é opcional e por trás de flag desde a auditoria #220 (item 13: `cards.html` mostra
 * empty-card sempre com ícone outline grande) — estados existentes que não passarem um ícone
 * continuam exibindo só título/mensagem, sem quebrar chamadas antigas.
 */
@Composable
fun SavroStatePanel(
    state: SavroState,
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    icon: SavroIcon? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val tone = when (state) {
        SavroState.Error -> SavroCardTone.Error
        SavroState.Offline -> SavroCardTone.Offline
        SavroState.Hidden -> SavroCardTone.Hidden
        SavroState.Loading, SavroState.Empty -> SavroCardTone.Standard
    }
    SavroCard(modifier = modifier.fillMaxWidth(), tone = tone) {
        Column(
            horizontalAlignment = Alignment.Start,
            verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
        ) {
            if (state == SavroState.Loading) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            } else if (icon != null) {
                Icon(
                    imageVector = icon.paraImageVector(),
                    contentDescription = null,
                    modifier = Modifier.size(SavroThemeTokens.spacing.xxl),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            Text(text = message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            action?.invoke()
        }
    }
}
