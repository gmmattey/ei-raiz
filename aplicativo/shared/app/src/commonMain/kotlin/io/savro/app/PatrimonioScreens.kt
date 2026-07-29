package io.savro.app

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.backhandler.BackHandler
import io.savro.common.Resultado
import io.savro.designsystem.componentes.SavroBottomNavItem
import io.savro.designsystem.componentes.SavroBottomNavScaffold
import io.savro.designsystem.componentes.SavroButton
import io.savro.designsystem.componentes.SavroButtonStyle
import io.savro.designsystem.componentes.SavroCard
import io.savro.designsystem.componentes.SavroConfirmDialog
import io.savro.designsystem.componentes.SavroFab
import io.savro.designsystem.componentes.SavroFilterChip
import io.savro.designsystem.componentes.SavroIcon
import io.savro.designsystem.componentes.SavroMenuAction
import io.savro.designsystem.componentes.SavroOverflowMenu
import io.savro.designsystem.componentes.SavroPrivacyText
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
import io.savro.domain.patrimonio.OrdenacaoItensPatrimoniais
import io.savro.domain.patrimonio.RascunhoFormularioItem
import io.savro.domain.patrimonio.ResumoItemPatrimonial
import io.savro.domain.patrimonio.ServicoPatrimonio
import io.savro.domain.patrimonio.ValidadorItemPatrimonial
import io.savro.domain.patrimonio.ordenarPor
import io.savro.model.ItemPatrimonial
import io.savro.model.TipoItemPatrimonial
import kotlinx.coroutines.launch

/**
 * Cadastro manual de patrimônio (issue #119). Navegação local (sem biblioteca externa — a #120 é
 * quem introduz navegação real entre Home/Patrimônio/Detalhe): lista com busca/filtro é o destino
 * padrão; formulário e ajuste de valor são sobrepostos por cima quando abertos.
 */
internal sealed class DestinoPatrimonio {
    data object Lista : DestinoPatrimonio()
    data class Detalhe(val itemId: String) : DestinoPatrimonio()
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
        is Detalhe -> "detalhe:$itemId"
        is Formulario -> "formulario:${itemIdEmEdicao.orEmpty()}"
        is Ajuste -> "ajuste:$itemId"
    }

    companion object {
        fun deChave(chave: String): DestinoPatrimonio = when {
            chave.isEmpty() -> Lista
            chave.startsWith("detalhe:") -> Detalhe(chave.removePrefix("detalhe:"))
            chave.startsWith("formulario:") -> Formulario(chave.removePrefix("formulario:").takeIf { it.isNotEmpty() })
            chave.startsWith("ajuste:") -> Ajuste(chave.removePrefix("ajuste:"))
            else -> Lista
        }
    }
}

internal enum class AbaPrincipal { HOME, PATRIMONIO }

/**
 * Regra pura de "para onde o botão/gesto de voltar do sistema deve levar" — extraída de
 * [TelaPatrimonio] para ser testável em `commonTest` sem depender de infraestrutura de UI
 * (issue #181). `null` significa "este nível não consome o back", deixando o próximo nível
 * (aba, ou o sistema) decidir.
 */
internal fun DestinoPatrimonio.aoVoltar(): DestinoPatrimonio? =
    if (this == DestinoPatrimonio.Lista) null else DestinoPatrimonio.Lista

/** Mesma ideia de [DestinoPatrimonio.aoVoltar], para a aba selecionada na Lista (#181). */
internal fun AbaPrincipal.aoVoltarNaLista(): AbaPrincipal? =
    if (this == AbaPrincipal.PATRIMONIO) AbaPrincipal.HOME else null

/**
 * Orquestra a experiência principal do app (issue #120): Home, Patrimônio (lista) e Detalhe
 * compartilham a mesma instância de [ServicoPatrimonio] (mesmos cálculos, dado único) e o mesmo
 * estado de ocultação global de valores — alternar "ocultar" em qualquer tela vale para todas.
 * Busca, filtro, ordenação e posição de rolagem ficam hospedados aqui (não dentro de
 * [TelaListaPatrimonio]) para sobreviver a uma ida e volta até o Detalhe.
 */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
internal fun TelaPatrimonio(servico: ServicoPatrimonio, aoAbrirConfiguracaoProtecao: () -> Unit) {
    var destino by rememberSaveable(
        stateSaver = Saver(save = { it.paraChave() }, restore = { DestinoPatrimonio.deChave(it) }),
    ) { mutableStateOf<DestinoPatrimonio>(DestinoPatrimonio.Lista) }
    var aba by rememberSaveable { mutableStateOf(AbaPrincipal.HOME) }
    var ocultarValores by rememberSaveable { mutableStateOf(false) }
    var texto by rememberSaveable { mutableStateOf("") }
    var tipoSelecionado by rememberSaveable { mutableStateOf<TipoItemPatrimonial?>(null) }
    var mostrarArquivados by rememberSaveable { mutableStateOf(false) }
    var ordenacao by rememberSaveable { mutableStateOf(OrdenacaoItensPatrimoniais.NOME_ASC) }
    val estadoDaLista = rememberLazyListState()

    LaunchedEffect(servico) { servico.carregar() }

    // Back Android/gesto preditivo (#181): primeiro sai de Detalhe/Formulário/Ajuste de volta pra
    // Lista; só quando já está na Lista é que a aba Patrimônio volta pra Home. Na Lista + Home não
    // há handler habilitado — o sistema decide (sair do app), como já era antes desta issue.
    BackHandler(enabled = destino.aoVoltar() != null) {
        destino = destino.aoVoltar() ?: destino
    }
    BackHandler(enabled = destino == DestinoPatrimonio.Lista && aba.aoVoltarNaLista() != null) {
        aba = aba.aoVoltarNaLista() ?: aba
    }

    when (val atual = destino) {
        // Bottom navigation com 3 destinos (protótipo `navigation.html`, reduzido de 4 para o
        // MVP1 — Histórico é backlog, timeline por item já vive no Detalhe). "Ajustes" não é uma
        // aba de conteúdo persistente: abre a configuração de proteção do cofre (#118) já existente
        // como overlay em `CofreScreens.kt` — por isso nunca aparece "selecionada" (#220, item 3/14).
        //
        // Correção pós-revisão do Luiz (PR #224): `SavroBottomNavScaffold` mede a barra e repassa
        // a altura real (via `contentPadding`) pro conteúdo — nada de overlay nem valor fixo. Cada
        // tela decide onde aplicar esse padding (lista rolável reserva o espaço; nada cobre a
        // última linha nem o FAB).
        DestinoPatrimonio.Lista -> SavroBottomNavScaffold(
            items = listOf(
                SavroBottomNavItem(
                    icon = SavroIcon.Home,
                    label = "Início",
                    selected = aba == AbaPrincipal.HOME,
                    onClick = { aba = AbaPrincipal.HOME },
                ),
                SavroBottomNavItem(
                    icon = SavroIcon.Patrimonio,
                    label = "Patrimônio",
                    selected = aba == AbaPrincipal.PATRIMONIO,
                    onClick = { aba = AbaPrincipal.PATRIMONIO },
                ),
                SavroBottomNavItem(
                    icon = SavroIcon.Ajustes,
                    label = "Ajustes",
                    selected = false,
                    onClick = aoAbrirConfiguracaoProtecao,
                ),
            ),
        ) { contentPadding ->
            when (aba) {
                AbaPrincipal.HOME -> TelaHomeResumo(
                    servico = servico,
                    ocultarValores = ocultarValores,
                    aoAlternarOcultarValores = { ocultarValores = !ocultarValores },
                    aoCriar = { destino = DestinoPatrimonio.Formulario(itemIdEmEdicao = null) },
                    aoAbrirItem = { id -> destino = DestinoPatrimonio.Detalhe(id) },
                    contentPadding = contentPadding,
                )
                AbaPrincipal.PATRIMONIO -> TelaListaPatrimonio(
                    servico = servico,
                    ocultarValores = ocultarValores,
                    texto = texto,
                    aoAlterarTexto = { texto = it },
                    tipoSelecionado = tipoSelecionado,
                    aoAlterarTipoSelecionado = { tipoSelecionado = it },
                    mostrarArquivados = mostrarArquivados,
                    aoAlterarMostrarArquivados = { mostrarArquivados = it },
                    ordenacao = ordenacao,
                    aoAlterarOrdenacao = { ordenacao = it },
                    estadoDaLista = estadoDaLista,
                    aoCriar = { destino = DestinoPatrimonio.Formulario(itemIdEmEdicao = null) },
                    aoAbrirDetalhe = { id -> destino = DestinoPatrimonio.Detalhe(id) },
                    aoEditar = { id -> destino = DestinoPatrimonio.Formulario(itemIdEmEdicao = id) },
                    aoAjustarValor = { id -> destino = DestinoPatrimonio.Ajuste(id) },
                    contentPadding = contentPadding,
                )
            }
        }
        is DestinoPatrimonio.Detalhe -> TelaDetalheItem(
            servico = servico,
            itemId = atual.itemId,
            ocultarValores = ocultarValores,
            aoVoltar = { destino = DestinoPatrimonio.Lista },
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
    ocultarValores: Boolean,
    texto: String,
    aoAlterarTexto: (String) -> Unit,
    tipoSelecionado: TipoItemPatrimonial?,
    aoAlterarTipoSelecionado: (TipoItemPatrimonial?) -> Unit,
    mostrarArquivados: Boolean,
    aoAlterarMostrarArquivados: (Boolean) -> Unit,
    ordenacao: OrdenacaoItensPatrimoniais,
    aoAlterarOrdenacao: (OrdenacaoItensPatrimoniais) -> Unit,
    estadoDaLista: LazyListState,
    aoCriar: () -> Unit,
    aoAbrirDetalhe: (String) -> Unit,
    aoEditar: (String) -> Unit,
    aoAjustarValor: (String) -> Unit,
    contentPadding: PaddingValues,
) {
    val itens by servico.itens.collectAsState()
    val escopo = rememberCoroutineScope()

    val filtro = FiltroItensPatrimoniais(
        texto = texto,
        tipos = tipoSelecionado?.let { setOf(it) } ?: emptySet(),
        incluirArquivados = mostrarArquivados,
    )
    val itensFiltrados = remember(itens, texto, tipoSelecionado, mostrarArquivados, ordenacao) {
        filtro.aplicar(itens).ordenarPor(ordenacao)
    }

    // FAB fixo (protótipo tela 08) substitui o botão "Novo item" de largura total — #220, item 10.
    // `contentPadding` vem de `SavroBottomNavScaffold` (altura real da bottom nav já medida, sem
    // valor fixo arbitrário) — aplicado aqui pra nem a lista, nem o FAB, ficarem por baixo da barra
    // (correção pós-revisão do Luiz, PR #224).
    Box(modifier = Modifier.fillMaxSize().padding(contentPadding)) {
        Column(modifier = Modifier.fillMaxSize().padding(SavroThemeTokens.spacing.md)) {
            SavroText("Patrimônio", style = SavroTextStyle.Headline)

            SavroTextField(
                value = texto,
                onValueChange = aoAlterarTexto,
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
                    onClick = { aoAlterarMostrarArquivados(!mostrarArquivados) },
                )
                // Mantém os 7 tipos reais do domínio como filtro (não os 4 grupos genéricos do
                // protótipo antigo) — já justificado por #196/SAVRO_PROTOTIPOS.md; divergência
                // mantida deliberadamente (#220, item 11).
                TipoItemPatrimonial.entries.forEach { tipo ->
                    SavroFilterChip(
                        label = rotuloDoTipo(tipo),
                        selected = tipoSelecionado == tipo,
                        onClick = { aoAlterarTipoSelecionado(if (tipoSelecionado == tipo) null else tipo) },
                    )
                }
            }

            // Controle único de ordenação (protótipo: "Ordenar ⌄") no lugar dos 2 chips
            // acumulativos — #220, item 11.
            SavroOverflowMenu(
                modifier = Modifier.padding(top = SavroThemeTokens.spacing.sm),
                contentDescription = "Ordenar",
                actions = listOf(
                    SavroMenuAction("Nome A→Z", { aoAlterarOrdenacao(OrdenacaoItensPatrimoniais.NOME_ASC) }),
                    SavroMenuAction("Nome Z→A", { aoAlterarOrdenacao(OrdenacaoItensPatrimoniais.NOME_DESC) }),
                    SavroMenuAction("Valor crescente", { aoAlterarOrdenacao(OrdenacaoItensPatrimoniais.VALOR_ASC) }),
                    SavroMenuAction("Valor decrescente", { aoAlterarOrdenacao(OrdenacaoItensPatrimoniais.VALOR_DESC) }),
                ),
                trigger = { abrir ->
                    SavroButton(
                        label = "Ordenar: ${rotuloDaOrdenacao(ordenacao)} ⌄",
                        onClick = abrir,
                        style = SavroButtonStyle.Secondary,
                        loadingStateDescription = "",
                    )
                },
            )

            if (itensFiltrados.isEmpty()) {
                SavroStatePanel(
                    state = SavroState.Empty,
                    title = "Nenhum item encontrado",
                    message = "Cadastre um item ou ajuste a busca/filtro.",
                    icon = if (texto.isNotBlank() || tipoSelecionado != null) SavroIcon.EstadoBuscaSemResultado else SavroIcon.EstadoVazio,
                    modifier = Modifier.padding(top = SavroThemeTokens.spacing.md),
                )
            } else {
                LazyColumn(
                    state = estadoDaLista,
                    modifier = Modifier.fillMaxSize().padding(top = SavroThemeTokens.spacing.md),
                    verticalArrangement = Arrangement.spacedBy(SavroThemeTokens.spacing.sm),
                ) {
                    items(itensFiltrados, key = { it.id }) { item ->
                    ItemPatrimonialCard(
                        item = item,
                        ocultarValores = ocultarValores,
                        aoAbrirDetalhe = { aoAbrirDetalhe(item.id) },
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

        SavroFab(
            contentDescription = "Novo item",
            onClick = aoCriar,
            modifier = Modifier.align(Alignment.BottomEnd).padding(SavroThemeTokens.spacing.md),
        )
    }
}

private fun rotuloDaOrdenacao(ordenacao: OrdenacaoItensPatrimoniais): String = when (ordenacao) {
    OrdenacaoItensPatrimoniais.NOME_ASC -> "Nome A→Z"
    OrdenacaoItensPatrimoniais.NOME_DESC -> "Nome Z→A"
    OrdenacaoItensPatrimoniais.VALOR_ASC -> "Valor crescente"
    OrdenacaoItensPatrimoniais.VALOR_DESC -> "Valor decrescente"
}

@Composable
private fun ItemPatrimonialCard(
    item: ItemPatrimonial,
    ocultarValores: Boolean,
    aoAbrirDetalhe: () -> Unit,
    aoEditar: () -> Unit,
    aoAjustarValor: () -> Unit,
    aoDuplicar: () -> Unit,
    aoArquivar: () -> Unit,
    aoExcluir: () -> Unit,
) {
    val valorFormatado = "${formatarValor(item)} ${item.moeda}"
    var confirmandoExclusao by remember { mutableStateOf(false) }

    if (confirmandoExclusao) {
        SavroConfirmDialog(
            title = "Excluir ${item.nome}?",
            message = "Esta ação não pode ser desfeita.",
            confirmLabel = "Excluir",
            cancelLabel = "Cancelar",
            onConfirm = { confirmandoExclusao = false; aoExcluir() },
            onDismiss = { confirmandoExclusao = false },
        )
    }

    // Ações que antes eram 5 botões sempre visíveis viram um menu "⋯" (protótipo tela 08) —
    // exclusão passa a exigir confirmação explícita (#220, item 10).
    SavroCard(
        modifier = Modifier.fillMaxWidth().clickable(onClick = aoAbrirDetalhe),
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            SavroText(item.nome, style = SavroTextStyle.Title)
            SavroOverflowMenu(
                contentDescription = "Mais opções para ${item.nome}",
                actions = listOf(
                    SavroMenuAction("Editar", aoEditar),
                    SavroMenuAction("Ajustar valor", aoAjustarValor),
                    SavroMenuAction("Duplicar", aoDuplicar),
                    SavroMenuAction(if (item.arquivado) "Desarquivar" else "Arquivar", aoArquivar),
                    SavroMenuAction("Excluir", { confirmandoExclusao = true }, destructive = true),
                ),
            )
        }
        SavroPrivacyText(
            prefixo = rotuloDoTipo(item.tipo),
            valorFormatado = valorFormatado,
            oculto = ocultarValores,
        )
        item.instituicao?.let { SavroText(it, style = SavroTextStyle.BodySmall) }
        if (item.arquivado) SavroText("Arquivado", style = SavroTextStyle.Label)
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
            // Nota de privacidade antes do CTA (protótipo tela 11) — #220, item 12.
            SavroText(
                "Nenhuma informação será enviada ao Savro.",
                style = SavroTextStyle.BodySmall,
            )
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
    // Campos opcionais colapsados sob "Campos avançados" (protótipo tela 11) — #220, item 12.
    val existeCampoAvancado = camposVisiveis.any {
        it in setOf(
            CampoFormularioItem.QUANTIDADE,
            CampoFormularioItem.PRECO_MEDIO,
            CampoFormularioItem.INSTITUICAO,
            CampoFormularioItem.OBSERVACAO,
        )
    }
    if (existeCampoAvancado) {
        var mostrarCamposAvancados by remember { mutableStateOf(false) }
        SavroButton(
            label = if (mostrarCamposAvancados) "Ocultar campos avançados" else "Campos avançados",
            onClick = { mostrarCamposAvancados = !mostrarCamposAvancados },
            style = SavroButtonStyle.Secondary,
            loadingStateDescription = "",
            modifier = Modifier.fillMaxWidth(),
        )
        if (mostrarCamposAvancados) {
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

internal fun formatarValor(item: ItemPatrimonial): String =
    ConversorMonetario.centavosParaTexto(item.valorCentavos)

internal fun rotuloDoTipo(tipo: TipoItemPatrimonial): String = when (tipo) {
    TipoItemPatrimonial.CONTA -> "Conta"
    TipoItemPatrimonial.RENDA_VARIAVEL -> "Renda variável"
    TipoItemPatrimonial.RENDA_FIXA -> "Renda fixa"
    TipoItemPatrimonial.CRIPTO -> "Cripto"
    TipoItemPatrimonial.BEM -> "Bem"
    TipoItemPatrimonial.DIVIDA -> "Dívida"
    TipoItemPatrimonial.OUTRO -> "Outro"
}
