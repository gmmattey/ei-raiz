package io.savro.backup

import io.savro.model.AjusteValorItem
import io.savro.model.EventoTimelineItem
import io.savro.model.ItemPatrimonial

/**
 * Retrato completo do cofre que vai dentro da parte cifrada do `*.savrobackup` (#121).
 *
 * O que **não** entra aqui, por decisão explícita:
 * - chave mestra do banco (Keystore no Android, Keychain no iOS) — o backup precisa abrir em
 *   outro aparelho, e o material criptográfico local não é transferível nem deve ser;
 * - política de proteção do cofre (biometria/credencial do dispositivo): depende de material que
 *   só existe no aparelho de origem. Restaurar "biometria ativada" em um aparelho onde a chave
 *   correspondente não existe anunciaria uma proteção inexistente. O usuário reativa a proteção
 *   no aparelho novo, e o app pergunta isso no onboarding.
 */
data class ConteudoBackup(
    val versaoEsquema: Int,
    val criadoEmEpocaMs: Long,
    val itens: List<ItemPatrimonial>,
    val ajustes: List<AjusteValorItem>,
    val eventos: List<EventoTimelineItem>,
    val preferencias: PreferenciasBackup,
) {
    /**
     * Ordem estável de coleções (issue #121: "serialização determinística"). Ordenar por id em vez
     * de por data garante uma ordem total mesmo quando dois registros compartilham o milissegundo.
     */
    fun ordenado(): ConteudoBackup = copy(
        itens = itens.sortedBy { it.id },
        ajustes = ajustes.sortedBy { it.id },
        eventos = eventos.sortedBy { it.id },
    )

    /**
     * Redaction (#130): mesmo com [ItemPatrimonial]/[AjusteValorItem]/[EventoTimelineItem] já
     * redigindo seus próprios campos, o `toString()` padrão de `data class` ainda listaria as
     * listas inteiras (`itens=[...]`) — só as contagens são seguras para log/mensagem técnica.
     */
    override fun toString(): String =
        "ConteudoBackup(versaoEsquema=$versaoEsquema, itens=${itens.size}, ajustes=${ajustes.size}, " +
            "eventos=${eventos.size})"
}

/**
 * Preferências do MVP1 que atravessam aparelhos. Hoje só o timeout de inatividade do cofre —
 * `onboardingConcluido` e `chaveInvalidadaPersistida` são estado local de instalação, não
 * preferência do usuário, e a política de proteção está descrita em [ConteudoBackup].
 */
data class PreferenciasBackup(val timeoutInatividadeMs: Long) {
    companion object {
        /** Igual a `PreferenciasCofrePadrao.TIMEOUT_INATIVIDADE_MS_PADRAO` (`:shared:core:security`). */
        const val TIMEOUT_INATIVIDADE_MS_PADRAO: Long = 60_000L

        val PADRAO = PreferenciasBackup(TIMEOUT_INATIVIDADE_MS_PADRAO)
    }
}

/**
 * O que a tela mostra antes de o usuário confirmar a restauração (issue #121: "prévia obrigatória
 * ... quantidade de itens, moedas encontradas, data do backup, versão do formato e o impacto").
 * Só existe depois de a senha ter autenticado o arquivo.
 */
data class PreviaBackup(
    val versaoFormato: Int,
    val versaoEsquema: Int,
    val criadoEmEpocaMs: Long,
    val totalDeItens: Int,
    val totalDeAjustes: Int,
    val totalDeEventos: Int,
    val moedas: List<String>,
    val itensNoCofreAtual: Int,
)

/** Fonte/destino das preferências restauráveis, implementada pelo host sobre o armazenamento nativo. */
interface PreferenciasRestauraveis {
    suspend fun ler(): PreferenciasBackup
    suspend fun gravar(preferencias: PreferenciasBackup)
}
