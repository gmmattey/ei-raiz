package io.savro.domain.patrimonio

import io.savro.common.Resultado

/**
 * Contrato de material criptográfico do cofre — hospedado aqui até `:shared:core:security` ser
 * extraído (ADR-002, seção "Estratégia para Keystore, Keychain e LocalAuthentication").
 *
 * Cobre só o que #180 precisa: obter/gerar a chave que abre o banco físico, e invalidar o cache
 * em memória dela. A máquina de estados completa do cofre (descriptografando, bloqueio temporário,
 * biometria indisponível, restauração necessária) é escopo da #118, construída por cima deste
 * contrato — #180 não implementa UI nem fluxo de desbloqueio.
 */
interface ProvedorChaveMestra {

    /**
     * Retorna a chave (256 bits) que abre o banco físico.
     *
     * - Android: chave gerada aleatoriamente na primeira execução, encapsulada por uma chave AES
     *   não exportável do Android Keystore (alias `savro.vault.master.v1`).
     * - iOS: chave equivalente protegida no Keychain (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`,
     *   não sincronizável ao iCloud Keychain).
     *
     * Nunca retorna a chave em caso de falha — retorna [ErroRepositorio.ChaveInvalida] (ou
     * [ErroRepositorio.Desconhecido] para falha de plataforma não relacionada à chave em si) e
     * não apaga nem recria material existente.
     */
    suspend fun obterOuCriarChave(): Resultado<ByteArray, ErroRepositorio>

    /**
     * Descarta qualquer cópia da chave mantida em memória por esta instância. Não afeta o
     * material persistido no Keystore/Keychain nem o arquivo do banco — é um hook de higiene de
     * memória para o ciclo de vida de app (background, bloqueio) que #118 vai orquestrar.
     */
    suspend fun invalidarCacheEmMemoria()
}
