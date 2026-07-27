package io.savro.common

/**
 * Fonte de tempo testável. `commonMain` nunca chama relógio do sistema diretamente — isso
 * impediria testes determinísticos de `criadoEm`/`atualizadoEm` e de invalidação de chave.
 *
 * `:shared:core:common` é módulo puro (sem API de plataforma em nenhum source set — ver
 * `verifyArchitecture`), então só a interface mora aqui. As implementações reais (`System
 * .currentTimeMillis()` no Android, `NSDate` no iOS) ficam em `:shared:core:database`, que é quem
 * de fato precisa de tempo de parede para `criadoEm`/`atualizadoEm`.
 */
interface Relogio {
    fun agoraEmEpocaMs(): Long
}
