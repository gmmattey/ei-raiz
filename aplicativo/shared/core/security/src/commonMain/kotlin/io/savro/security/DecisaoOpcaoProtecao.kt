package io.savro.security

/**
 * Decisão pura (#226) sobre o que a UI faz com uma [DisponibilidadeBiometria] real — nenhuma
 * plataforma decide isso, e nenhuma tela decide isso lendo o motivo "na unha" (evita 8 `when`
 * espalhados divergindo aos poucos). Sem dependência de Compose/strings: mensagem final fica em
 * `:shared:app`, aqui só o "sim/não" e "por quê" estruturado.
 */
object DecisaoOpcaoProtecao {

    /** A opção só aparece marcável (rádio habilitado, botão habilitado) quando está pronta agora. */
    fun habilitada(disponibilidade: DisponibilidadeBiometria): Boolean =
        disponibilidade == DisponibilidadeBiometria.Disponivel

    /**
     * "Tentar novamente" só faz sentido quando o motivo é transitório — sem hardware, sem
     * cadastro, sem credencial do aparelho ou bloqueio permanente não mudam sozinhos só porque o
     * usuário apertou um botão de novo; exigem uma ação fora do app (ou, no caso do bloqueio
     * permanente, confirmar a credencial do aparelho, que já é o próprio fluxo de autenticação).
     */
    fun permiteTentarNovamente(disponibilidade: DisponibilidadeBiometria): Boolean = when (disponibilidade) {
        DisponibilidadeBiometria.SemHardware,
        DisponibilidadeBiometria.NaoConfigurada,
        DisponibilidadeBiometria.SemCredencialDispositivo,
        DisponibilidadeBiometria.BloqueadaPermanentemente,
        -> false

        DisponibilidadeBiometria.Disponivel,
        DisponibilidadeBiometria.Indisponivel,
        is DisponibilidadeBiometria.BloqueadaTemporariamente,
        is DisponibilidadeBiometria.ErroDesconhecido,
        -> true
    }

    /**
     * "Continuar sem proteção" precisa estar sempre presente quando a opção não está disponível —
     * é a garantia de que uma detecção errada de biometria nunca deixa o usuário preso fora do
     * cofre (regra do projeto, ver `GerenciadorCofre.removerProtecao`).
     */
    fun permiteContinuarSemProtecao(disponibilidade: DisponibilidadeBiometria): Boolean =
        disponibilidade != DisponibilidadeBiometria.Disponivel
}
