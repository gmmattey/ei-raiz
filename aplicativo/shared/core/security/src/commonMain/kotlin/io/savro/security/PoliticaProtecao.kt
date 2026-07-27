package io.savro.security

/**
 * Política de proteção do cofre — configurável pelo usuário (ativar, alterar, remover), nunca
 * decidida automaticamente. [Nenhuma] é o estado inicial após o onboarding quando o usuário opta
 * por continuar sem biometria (#118, "Permitir continuar sem biometria, com aviso claro").
 *
 * A chave mestra do cofre (`ProvedorChaveMestra`, #180) nunca exige autenticação de usuário no
 * nível do Keystore/Keychain — a política aqui é inteiramente uma decisão de estado de app sobre
 * *quando* pedir autenticação antes de abrir o cofre, não sobre *como* a chave é protegida.
 */
sealed class PoliticaProtecao {
    data object Nenhuma : PoliticaProtecao()

    /**
     * Biometria (Face ID/Touch ID/impressão digital) ou equivalente forte do dispositivo.
     * [permitirCredencialDispositivo] decide se o código/PIN/padrão do aparelho é aceito como
     * alternativa quando a biometria falha ou não está configurada — "alterar" a proteção
     * (critério de aceite da #118) é justamente alternar este valor.
     */
    data class Ativada(val permitirCredencialDispositivo: Boolean = true) : PoliticaProtecao()
}
